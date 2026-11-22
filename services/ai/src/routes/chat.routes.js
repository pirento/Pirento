// The signed-in person's side of Pirento AI: status and allowance, plans, saved chats, a message (with the
// product it was asked from), and a thumbs up or down on an answer.
import {Router} from 'express';
import {z} from 'zod';
import {PRODUCTS} from '@pirento/shared';
import {ApiError, isId, notFound, validate} from '@pirento/shared/server';
import {config} from '../config.js';
import {Chat} from '../models/Chat.js';
import {Feedback} from '../models/Feedback.js';
import {Plan} from '../models/Plan.js';
import {readSettings} from '../models/Settings.js';
import {streamReply} from '../lib/claude.js';
import {knowledgeText} from '../lib/knowledge.js';
import {allowanceOf, buyPlan} from '../lib/plans.js';
import {giveBack, takeOne, usedToday} from '../lib/usage.js';

export const chatRoutes = Router();

const findOwnChat = async (req) => {
  const chat = isId(req.params.id) && (await Chat.findOne({_id: req.params.id, userId: req.user.sub}));
  if (!chat) throw notFound('Chat not found');
  return chat;
};

const productName = (slug) => PRODUCTS.find((p) => p.slug === slug)?.name ?? '';

chatRoutes.get('/status', async (req, res) => {
  const [settings, allowance] = await Promise.all([readSettings(), allowanceOf(req.user.sub)]);
  res.json({data: {enabled: config.enabled && settings.on, dailyLimit: allowance.limit, plan: allowance.plan}});
});

/** Messages sent today and today's allowance, for the meter. */
chatRoutes.get('/usage', async (req, res) => {
  const [used, allowance] = await Promise.all([usedToday(req.user.sub), allowanceOf(req.user.sub)]);
  res.json({data: {used, limit: allowance.limit, plan: allowance.plan}});
});

chatRoutes.get('/plans', async (_req, res) => {
  const [plans, settings] = await Promise.all([
    Plan.find({active: true}, {name: 1, price: 1, dailyLimit: 1, months: 1}).sort({price: 1}).lean(),
    readSettings(),
  ]);
  res.json({data: {free: settings.freeDailyLimit, plans}});
});

chatRoutes.post('/plans/:id/buy', async (req, res) => {
  if (!isId(req.params.id)) throw notFound('This plan is not on offer');
  res.json({data: await buyPlan(req.user.sub, req.params.id)});
});

chatRoutes.get('/chats', async (req, res) => {
  res.json({data: await Chat.find({userId: req.user.sub}, {messages: 0}).sort({updatedAt: -1}).limit(50)});
});

chatRoutes.get('/chats/:id', async (req, res) => res.json({data: await findOwnChat(req)}));

chatRoutes.delete('/chats/:id', async (req, res) => {
  const chat = await findOwnChat(req);
  await Promise.all([chat.deleteOne(), Feedback.deleteMany({chatId: String(chat._id)})]);
  res.json({data: {deleted: true}});
});

/**
 * One turn of conversation. `:id` is a chat id, or "new" to start one (with the product it is asked from).
 * The reply streams back as plain text; the chat id is in the x-chat-id header, so the page can show a new
 * chat before the reply finishes.
 */
chatRoutes.post(
  '/chats/:id/messages',
  validate(
    z.object({
      content: z.string().trim().min(1, 'Write a message').max(2000),
      product: z
        .string()
        .max(30)
        .refine((s) => !s || PRODUCTS.some((p) => p.slug === s))
        .default(''),
    }),
  ),
  async (req, res) => {
    const settings = await readSettings();
    if (!config.enabled) throw new ApiError(503, 'AI_UNAVAILABLE', 'Pirento AI is not switched on yet');
    if (!settings.on) throw new ApiError(503, 'AI_PAUSED', 'Pirento AI is paused for a short while. Try again soon.');
    const {limit} = await allowanceOf(req.user.sub);
    if (!(await takeOne(req.user.sub, limit))) {
      throw new ApiError(
        429,
        'DAILY_LIMIT',
        `You can send ${limit} messages a day. Try again tomorrow, or see the plans.`,
      );
    }

    const chat =
      req.params.id === 'new'
        ? new Chat({
            userId: req.user.sub,
            title: req.body.content.slice(0, 80),
            product: req.body.product,
            messages: [],
          })
        : await findOwnChat(req);
    chat.messages.push({role: 'user', content: req.body.content});
    await chat.save();

    res.set({'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-chat-id': String(chat._id)});
    let reply = '';
    try {
      const final = await streamReply(
        chat.messages,
        (text) => {
          reply += text;
          res.write(text);
        },
        {userId: req.user.sub, product: productName(chat.product), knowledge: await knowledgeText()},
      );
      if (final.stop_reason === 'refusal') {
        reply = 'Sorry, I can’t help with that. For anything about your account or an order, write to /support.';
        res.write(`\n\n${reply}`);
      } else if (['max_tokens', 'tool_use'].includes(final.stop_reason)) {
        res.write('\n\n(Reply cut short.)');
      }
    } catch (err) {
      // The headers are already sent, so the error goes into the text, never a half-JSON body.
      console.error(err);
      if (!reply) {
        // Nothing came back: drop the question too, so a failed turn never enters the history.
        chat.messages.pop();
        await chat.save();
        await giveBack(req.user.sub);
        return res.end('Sorry, something went wrong. Please try again.');
      }
    }
    chat.messages.push({role: 'assistant', content: reply});
    await chat.save();
    res.end();
  },
);

/** A thumbs up or down on one answer; rating it again replaces the first. */
chatRoutes.post(
  '/chats/:id/feedback',
  validate(
    z.object({
      index: z.number().int().min(1).max(500),
      rating: z.enum(['up', 'down']),
      note: z.string().trim().max(500).default(''),
    }),
  ),
  async (req, res) => {
    const chat = await findOwnChat(req);
    const answer = chat.messages[req.body.index];
    if (answer?.role !== 'assistant') throw notFound('No answer there');
    const question = chat.messages[req.body.index - 1]?.content ?? '';
    const doc = await Feedback.findOneAndUpdate(
      {chatId: String(chat._id), index: req.body.index},
      {
        $set: {
          ...req.body,
          userId: req.user.sub,
          product: chat.product,
          question: question.slice(0, 500),
          answer: answer.content.slice(0, 1500),
        },
      },
      {upsert: true, new: true},
    );
    res.json({data: {rating: doc.rating}});
  },
);
