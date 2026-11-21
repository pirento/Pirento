// Saved chats, and sending a message to the assistant.
import {Router} from 'express';
import {z} from 'zod';
import {ApiError, isId, notFound, validate} from '@pirento/shared/server';
import {config} from '../config.js';
import {Chat} from '../models/Chat.js';
import {DAILY_LIMIT} from '../lib/prompt.js';
import {streamReply} from '../lib/claude.js';
import {giveBack, takeOne, usedToday} from '../lib/usage.js';

export const chatRoutes = Router();

const findOwnChat = async (req) => {
  const chat = isId(req.params.id) && (await Chat.findOne({_id: req.params.id, userId: req.user.sub}));
  if (!chat) throw notFound('Chat not found');
  return chat;
};

chatRoutes.get('/status', (_req, res) => res.json({data: {enabled: config.enabled, dailyLimit: DAILY_LIMIT}}));

/** Messages sent today and the daily allowance, for the meter on the AI dashboard. */
chatRoutes.get('/usage', async (req, res) => {
  res.json({data: {used: await usedToday(req.user.sub), limit: DAILY_LIMIT}});
});

chatRoutes.get('/chats', async (req, res) => {
  res.json({data: await Chat.find({userId: req.user.sub}, {messages: 0}).sort({updatedAt: -1}).limit(50)});
});

chatRoutes.get('/chats/:id', async (req, res) => res.json({data: await findOwnChat(req)}));

chatRoutes.delete('/chats/:id', async (req, res) => {
  await (await findOwnChat(req)).deleteOne();
  res.json({data: {deleted: true}});
});

/**
 * One turn of conversation. `:id` is a chat id, or "new" to start one.
 * The reply streams back as plain text; the chat id is in the x-chat-id
 * header, so the page can show a new chat before the reply finishes.
 */
chatRoutes.post(
  '/chats/:id/messages',
  validate(z.object({content: z.string().trim().min(1, 'Write a message').max(2000)})),
  async (req, res) => {
    if (!config.enabled) throw new ApiError(503, 'AI_UNAVAILABLE', 'Pirento AI is not switched on yet');
    if (!(await takeOne(req.user.sub, DAILY_LIMIT))) {
      throw new ApiError(429, 'DAILY_LIMIT', `You can send ${DAILY_LIMIT} messages a day. Try again tomorrow.`);
    }

    const chat =
      req.params.id === 'new'
        ? new Chat({userId: req.user.sub, title: req.body.content.slice(0, 80), messages: []})
        : await findOwnChat(req);
    chat.messages.push({role: 'user', content: req.body.content});
    await chat.save();

    res.set({'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-chat-id': String(chat._id)});
    let reply = '';
    try {
      const final = await streamReply(chat.messages, (text) => {
        reply += text;
        res.write(text);
      });
      if (final.stop_reason === 'refusal') {
        reply = 'Sorry, I can’t help with that. For anything about your account or an order, write to /support.';
        res.write(`\n\n${reply}`);
      } else if (final.stop_reason === 'max_tokens') {
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
