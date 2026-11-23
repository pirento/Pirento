// Called by the auth service when an account is deleted. Tickets stay as a record of the work,
// but the person's email and everything they wrote are removed, and so are their contact-form enquiries.
import {Router} from 'express';
import {z} from 'zod';
import {ApiError, nextSeq, requireInternal, validate} from '@pirento/shared/server';
import {PRODUCTS} from '@pirento/shared';
import {Ticket} from '../models/Ticket.js';
import {Enquiry} from '../models/Enquiry.js';
import {triage} from '../lib/triage.js';

export const internalRoutes = Router();
internalRoutes.use('/internal', requireInternal);

internalRoutes.post(
  '/internal/forget',
  validate(z.object({userId: z.string().min(1).max(40), email: z.email().optional()})),
  async (req, res) => {
    const {userId, email} = req.body;
    // Contact-form enquiries carry no account, only the email they were sent from.
    if (email) await Enquiry.deleteMany({email: email.toLowerCase()});
    await Ticket.updateMany(
      {userId},
      {
        $set: {
          email: `deleted-${userId}@deleted.invalid`,
          'messages.$[mine].body': '[removed when the account was deleted]',
        },
      },
      {arrayFilters: [{'mine.from': 'customer'}]},
    );
    res.json({data: {forgotten: true}});
  },
);

/** Pirento AI's look at a person's own support tickets: number, subject and status of the latest ten. */
internalRoutes.post(
  '/internal/assistant',
  validate(z.object({userId: z.string().min(1).max(40)})),
  async (req, res) => {
    const tickets = await Ticket.find(
      {userId: req.body.userId},
      {ticketNo: 1, subject: 1, status: 1, product: 1, updatedAt: 1},
    )
      .sort({updatedAt: -1})
      .limit(10)
      .lean();
    res.json({data: tickets.map(({_id, ...t}) => ({...t, link: `/support/${_id}`}))});
  },
);

/**
 * Pirento AI opens a ticket for the signed-in person when they ask it to. At most three a day per person, so a
 * confused conversation cannot flood the desk.
 */
internalRoutes.post(
  '/internal/tickets',
  validate(
    z.object({
      userId: z.string().min(1).max(40),
      email: z.email(),
      subject: z.string().trim().min(3).max(120),
      message: z.string().trim().min(2).max(4000),
      product: z.enum(PRODUCTS.map((p) => p.slug)).optional(),
    }),
  ),
  async (req, res) => {
    const {userId, email, subject, message, product} = req.body;
    const since = new Date(Date.now() - 86_400_000);
    if ((await Ticket.countDocuments({userId, via: 'ai', createdAt: {$gte: since}})) >= 3) {
      throw new ApiError(429, 'TOO_MANY', 'Three requests were already opened through the assistant today');
    }
    const ticket = await Ticket.create({
      ticketNo: (await nextSeq('ticket')) + 10_000_000,
      userId,
      email,
      subject,
      product,
      via: 'ai',
      messages: [{from: 'customer', body: message}],
    });
    triage(ticket); // in the background
    res.status(201).json({data: {ticketNo: ticket.ticketNo, link: `/support/${ticket._id}`}});
  },
);

/** Pirento AI's admin answers: open tickets by status, priority and product, and the oldest still open. */
internalRoutes.post('/internal/staff-summary', validate(z.object({}).passthrough()), async (_req, res) => {
  const [counts, oldest] = await Promise.all([
    Ticket.aggregate([
      {$match: {status: {$ne: 'closed'}}},
      {$group: {_id: {status: '$status', priority: '$priority', product: '$product'}, n: {$sum: 1}}},
    ]),
    Ticket.find({status: 'open'}, {ticketNo: 1, subject: 1, priority: 1, product: 1, createdAt: 1})
      .sort({createdAt: 1})
      .limit(10)
      .lean(),
  ]);
  res.json({
    data: {notClosed: counts.map((c) => ({...c._id, count: c.n})), oldestOpen: oldest.map(({_id, ...t}) => t)},
  });
});
