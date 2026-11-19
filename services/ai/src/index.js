import Anthropic from '@anthropic-ai/sdk';
import mongoose from 'mongoose';
import {z} from 'zod';
import {ApiError, asyncHandler, createApp, env, finish, requireAuth, start, validate} from '@pirento/shared/server';
import {DAILY_LIMIT, buildRequest} from './prompt.js';

const Chat = mongoose.model(
  'Chat',
  new mongoose.Schema(
    {
      userId: {type: String, required: true, index: true},
      title: {type: String, maxlength: 80},
      messages: [
        {
          _id: false,
          role: {type: String, enum: ['user', 'assistant']},
          content: String,
          at: {type: Date, default: Date.now},
        },
      ],
    },
    {timestamps: true},
  ),
);

// Off until a key is configured; the website says so instead of failing.
const client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

const app = createApp('ai');
app.use(requireAuth);

app.get('/status', (_req, res) => res.json({data: {enabled: Boolean(client), dailyLimit: DAILY_LIMIT}}));

app.get(
  '/chats',
  asyncHandler(async (req, res) => {
    res.json({data: await Chat.find({userId: req.user.sub}, {messages: 0}).sort({updatedAt: -1}).limit(50)});
  }),
);

const mine = async (req) => {
  const chat =
    mongoose.isValidObjectId(req.params.id) && (await Chat.findOne({_id: req.params.id, userId: req.user.sub}));
  if (!chat) throw new ApiError(404, 'NOT_FOUND', 'Chat not found');
  return chat;
};

app.get(
  '/chats/:id',
  asyncHandler(async (req, res) => res.json({data: await mine(req)})),
);

app.delete(
  '/chats/:id',
  asyncHandler(async (req, res) => {
    await (await mine(req)).deleteOne();
    res.json({data: {deleted: true}});
  }),
);

/**
 * One turn. The reply streams back as plain text chunks; the chat id comes in
 * the x-chat-id header so a new chat can be opened before the reply finishes.
 */
app.post(
  '/chats/:id/messages',
  validate(z.object({content: z.string().trim().min(1, 'Write a message').max(2000)})),
  asyncHandler(async (req, res) => {
    if (!client) throw new ApiError(503, 'AI_UNAVAILABLE', 'Pirento AI is not switched on yet');

    const since = new Date(Date.now() - 86_400_000);
    const [{used = 0} = {}] = await Chat.aggregate([
      {$match: {userId: req.user.sub}},
      {$unwind: '$messages'},
      {$match: {'messages.role': 'user', 'messages.at': {$gte: since}}},
      {$count: 'used'},
    ]);
    if (used >= DAILY_LIMIT)
      throw new ApiError(429, 'DAILY_LIMIT', `You can send ${DAILY_LIMIT} messages a day. Try again tomorrow.`);

    const chat =
      req.params.id === 'new'
        ? new Chat({userId: req.user.sub, title: req.body.content.slice(0, 80), messages: []})
        : await mine(req);
    chat.messages.push({role: 'user', content: req.body.content});
    await chat.save();

    res.set({'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', 'x-chat-id': String(chat._id)});
    let reply = '';
    try {
      const stream = client.beta.messages.stream(buildRequest(chat.messages));
      stream.on('text', (text) => {
        reply += text;
        res.write(text);
      });
      const final = await stream.finalMessage();
      if (final.stop_reason === 'refusal') {
        reply = 'Sorry, I can’t help with that. For anything about your account or an order, write to /support.';
        res.write(`\n\n${reply}`);
      } else if (final.stop_reason === 'max_tokens') {
        res.write('\n\n(Reply cut short.)');
      }
    } catch (err) {
      // Headers are already sent, so the error goes into the text, never a half-JSON body.
      console.error(err);
      if (!reply) {
        // Nothing came back: drop the question too, so a failed turn never enters the history.
        chat.messages.pop();
        await chat.save();
        return res.end('Sorry, something went wrong. Please try again.');
      }
    }
    chat.messages.push({role: 'assistant', content: reply});
    await chat.save();
    res.end();
  }),
);

start(finish(app), {
  name: 'ai',
  port: Number(env('PORT', 4009)),
  mongoUri: env('MONGO_URI', 'mongodb://127.0.0.1:27017/pirento_ai'),
});
