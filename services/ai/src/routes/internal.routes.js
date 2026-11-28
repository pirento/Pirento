// Internal routes: forgetting a deleted account, and the Pirento Intern jobs the learning service asks for.
import {Router} from 'express';
import {z} from 'zod';
import {ApiError, requireInternal, validate} from '@pirento/shared/server';
import {config} from '../config.js';
import {Chat} from '../models/Chat.js';
import {Usage} from '../models/Usage.js';
import {Feedback} from '../models/Feedback.js';
import {Subscription} from '../models/Subscription.js';
import {Memory} from '../models/Memory.js';
import {JOBS, runJob} from '../lib/jobs.js';
import {streamReply} from '../lib/claude.js';
import {knowledgeText} from '../lib/knowledge.js';

export const internalRoutes = Router();
internalRoutes.use('/internal', requireInternal);

internalRoutes.post('/internal/forget', validate(z.object({userId: z.string().min(1).max(40)})), async (req, res) => {
  const {userId} = req.body;
  await Promise.all([
    Chat.deleteMany({userId}),
    Usage.deleteMany({userId}),
    Feedback.deleteMany({userId}),
    Subscription.deleteMany({userId}),
    Memory.deleteMany({userId}),
  ]);
  res.json({data: {forgotten: true}});
});

/** One intern job ({input} is the job's facts). 503 without a key, 502 when Claude gave no usable answer. */
// /internal/jobs/:kind for every job; /internal/intern/:kind is the older name the learning service uses.
internalRoutes.post(
  ['/internal/jobs/:kind', '/internal/intern/:kind'],
  validate(
    z.object({
      input: z.record(z.string(), z.unknown()),
      attachments: z.array(z.record(z.string(), z.unknown())).max(5).default([]),
    }),
  ),
  async (req, res) => {
    if (!Object.hasOwn(JOBS, req.params.kind)) throw new ApiError(404, 'NOT_FOUND', 'No such job');
    if (!config.enabled) throw new ApiError(503, 'AI_OFF', 'The AI is not set up');
    // Keep the input bounded: the learning service sends summaries, never whole histories.
    if (JSON.stringify(req.body.input).length > 40_000) throw new ApiError(400, 'TOO_LARGE', 'Input too large');
    const out = await runJob(req.params.kind, req.body.input, '', req.body.attachments);
    if (!out) throw new ApiError(502, 'AI_NO_ANSWER', 'The AI gave no usable answer');
    res.json({data: out});
  },
);

/**
 * One reply for a chat held outside the website (WhatsApp, from the support service): the same assistant, tools and
 * team notes as the site, for the person the number belongs to, or with no tools when it is on no account.
 * The caller keeps the conversation and its own daily limit. 503 when the AI is off; the caller falls back.
 */
internalRoutes.post(
  '/internal/chat-turn',
  validate(
    z.object({
      userId: z.string().max(40).optional(),
      email: z.string().max(200).optional(),
      channel: z.enum(['whatsapp']).default('whatsapp'),
      history: z
        .array(z.object({role: z.enum(['user', 'assistant']), content: z.string().min(1).max(4000)}))
        .min(1)
        .max(20),
    }),
  ),
  async (req, res) => {
    if (!config.enabled) throw new ApiError(503, 'AI_OFF', 'The AI is not set up');
    const {userId, email, channel, history} = req.body;
    const final = await streamReply(history, () => {}, {
      who: userId ? {userId, email} : undefined,
      noTools: !userId,
      channel,
      knowledge: await knowledgeText(),
    });
    const reply = final.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();
    if (!reply || final.stop_reason === 'refusal') throw new ApiError(502, 'AI_NO_ANSWER', 'No answer');
    res.json({data: {reply}});
  },
);
