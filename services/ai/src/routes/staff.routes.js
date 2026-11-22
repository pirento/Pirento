// Admin → Pirento AI: usage at a glance, the switch and free allowance and paid plans (superadmin), the knowledge
// base the assistant answers from, answers people rated, and reply drafts for the support desk.
import {Router} from 'express';
import {z} from 'zod';
import {ACCESS, ApiError, audit, isId, notFound, requireAuth, requireRole, validate} from '@pirento/shared/server';
import {config} from '../config.js';
import {Chat} from '../models/Chat.js';
import {Feedback} from '../models/Feedback.js';
import {Knowledge} from '../models/Knowledge.js';
import {Plan} from '../models/Plan.js';
import {Settings, readSettings} from '../models/Settings.js';
import {Subscription} from '../models/Subscription.js';
import {Usage} from '../models/Usage.js';
import {knowledgeText} from '../lib/knowledge.js';
import {runJob} from '../lib/jobs.js';
import {today} from '../lib/usage.js';

export const staffRoutes = Router();
const staff = Router();
staff.use(requireAuth, requireRole(...ACCESS.ai));
staffRoutes.use('/staff/ai', staff);
const superadmin = requireRole(...ACCESS.catalog);

staff.get('/overview', async (_req, res) => {
  const since = new Date(Date.now() - 30 * 86_400_000);
  const [settings, todays, chats30, ratings, subscribers] = await Promise.all([
    readSettings(),
    Usage.aggregate([{$match: {day: today()}}, {$group: {_id: null, messages: {$sum: '$n'}, people: {$sum: 1}}}]),
    Chat.countDocuments({updatedAt: {$gte: since}}),
    Feedback.aggregate([{$match: {createdAt: {$gte: since}}}, {$group: {_id: '$rating', n: {$sum: 1}}}]),
    Subscription.countDocuments({until: {$gt: new Date()}}),
  ]);
  const rated = Object.fromEntries(ratings.map((r) => [r._id, r.n]));
  res.json({
    data: {
      keySet: config.enabled,
      on: settings.on,
      freeDailyLimit: settings.freeDailyLimit,
      messagesToday: todays[0]?.messages ?? 0,
      peopleToday: todays[0]?.people ?? 0,
      chats30: chats30,
      up30: rated.up ?? 0,
      down30: rated.down ?? 0,
      subscribers,
    },
  });
});

staff.put(
  '/settings',
  superadmin,
  validate(z.object({on: z.boolean(), freeDailyLimit: z.number().int().min(0).max(1000)})),
  async (req, res) => {
    const doc = await Settings.findByIdAndUpdate('ai', {$set: req.body}, {upsert: true, new: true});
    audit(req, 'ai.settings', req.body.on ? 'on' : 'off', `free ${req.body.freeDailyLimit}/day`);
    res.json({data: doc});
  },
);

const planBody = z.object({
  name: z.string().trim().min(2).max(40),
  price: z.number().int().min(100).max(10_000_000), // paise
  dailyLimit: z.number().int().min(1).max(1000),
  months: z.number().int().min(1).max(24),
  active: z.boolean().default(true),
});

staff.get('/plans', async (_req, res) => res.json({data: await Plan.find().sort({price: 1})}));

staff.post('/plans', superadmin, validate(planBody), async (req, res) => {
  const doc = await Plan.create({...req.body, createdBy: req.user.email});
  audit(req, 'ai.plan.create', doc.name, `₹${doc.price / 100}`);
  res.status(201).json({data: doc});
});

// A plan's changes apply to new purchases only: what someone bought is copied onto their subscription.
staff.patch('/plans/:id', superadmin, validate(planBody), async (req, res) => {
  const doc = isId(req.params.id) && (await Plan.findByIdAndUpdate(req.params.id, {$set: req.body}, {new: true}));
  if (!doc) throw notFound('Plan not found');
  audit(req, 'ai.plan.update', doc.name, doc.active ? `₹${doc.price / 100}` : 'off sale');
  res.json({data: doc});
});

const knowledgeBody = z.object({
  title: z.string().trim().min(3).max(120),
  body: z.string().trim().min(20, 'Write the note').max(4000),
  product: z.string().trim().max(30).default(''),
  published: z.boolean(),
});

staff.get('/knowledge', async (_req, res) => {
  res.json({data: await Knowledge.find().sort({published: -1, updatedAt: -1}).limit(500)});
});

staff.post('/knowledge', validate(knowledgeBody), async (req, res) => {
  const doc = await Knowledge.create({...req.body, updatedBy: req.user.email});
  audit(req, 'ai.knowledge.create', doc.title);
  res.status(201).json({data: doc});
});

staff.put('/knowledge/:id', validate(knowledgeBody), async (req, res) => {
  const doc =
    isId(req.params.id) &&
    (await Knowledge.findByIdAndUpdate(req.params.id, {$set: {...req.body, updatedBy: req.user.email}}, {new: true}));
  if (!doc) throw notFound('Note not found');
  audit(req, 'ai.knowledge.update', doc.title, doc.published ? 'published' : 'draft');
  res.json({data: doc});
});

staff.delete('/knowledge/:id', async (req, res) => {
  const doc = isId(req.params.id) && (await Knowledge.findByIdAndDelete(req.params.id));
  if (!doc) throw notFound('Note not found');
  audit(req, 'ai.knowledge.delete', doc.title);
  res.json({data: {deleted: true}});
});

staff.get('/feedback', async (req, res) => {
  const filter = ['up', 'down'].includes(req.query.rating) ? {rating: req.query.rating} : {};
  res.json({data: await Feedback.find(filter, {userId: 0}).sort({createdAt: -1}).limit(200)});
});

/** A draft reply for a support ticket, from the conversation and the knowledge base. Staff edit it before sending. */
staffRoutes.post(
  '/staff/ai/draft-reply',
  requireAuth,
  requireRole(...ACCESS.support),
  validate(
    z.object({
      subject: z.string().max(200),
      product: z.string().max(30).default(''),
      messages: z
        .array(z.object({from: z.enum(['customer', 'team']), body: z.string().max(4000)}))
        .min(1)
        .max(30),
    }),
  ),
  async (req, res) => {
    if (!config.enabled) throw new ApiError(503, 'AI_UNAVAILABLE', 'Pirento AI is not switched on yet');
    const draft = await runJob('ticketReply', req.body, await knowledgeText());
    if (!draft) throw new ApiError(502, 'AI_NO_ANSWER', 'The AI gave no usable draft. Write the reply yourself.');
    res.json({data: draft});
  },
);
