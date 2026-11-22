// Internal routes: forgetting a deleted account, and the Pirento Intern jobs the learning service asks for.
import {Router} from 'express';
import {z} from 'zod';
import {ApiError, requireInternal, validate} from '@pirento/shared/server';
import {config} from '../config.js';
import {Chat} from '../models/Chat.js';
import {Usage} from '../models/Usage.js';
import {Feedback} from '../models/Feedback.js';
import {Subscription} from '../models/Subscription.js';
import {JOBS, runJob} from '../lib/jobs.js';

export const internalRoutes = Router();
internalRoutes.use('/internal', requireInternal);

internalRoutes.post('/internal/forget', validate(z.object({userId: z.string().min(1).max(40)})), async (req, res) => {
  const {userId} = req.body;
  await Promise.all([
    Chat.deleteMany({userId}),
    Usage.deleteMany({userId}),
    Feedback.deleteMany({userId}),
    Subscription.deleteMany({userId}),
  ]);
  res.json({data: {forgotten: true}});
});

/** One intern job ({input} is the job's facts). 503 without a key, 502 when Claude gave no usable answer. */
internalRoutes.post(
  '/internal/intern/:kind',
  validate(z.object({input: z.record(z.string(), z.unknown())})),
  async (req, res) => {
    if (!Object.hasOwn(JOBS, req.params.kind)) throw new ApiError(404, 'NOT_FOUND', 'No such job');
    if (!config.enabled) throw new ApiError(503, 'AI_OFF', 'The AI is not set up');
    // Keep the input bounded: the learning service sends summaries, never whole histories.
    if (JSON.stringify(req.body.input).length > 40_000) throw new ApiError(400, 'TOO_LARGE', 'Input too large');
    const out = await runJob(req.params.kind, req.body.input);
    if (!out) throw new ApiError(502, 'AI_NO_ANSWER', 'The AI gave no usable answer');
    res.json({data: out});
  },
);
