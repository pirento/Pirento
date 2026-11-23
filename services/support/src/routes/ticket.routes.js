// Opening a ticket, reading it, replying and closing.
import {Router} from 'express';
import {z} from 'zod';
import {ApiError, audit, canUse, isId, nextSeq, notFound, notify, validate} from '@pirento/shared/server';
import {PRODUCTS, getProduct} from '@pirento/shared';
import {PRIORITIES, Ticket} from '../models/Ticket.js';
import {triage} from '../lib/triage.js';

export const ticketRoutes = Router();

const messageBody = z.string().trim().min(2, 'Write a message').max(4000);

/** The team opens tickets that are theirs or nobody's yet; a superadmin opens any. */
const teamCanOpen = (req, ticket) =>
  canUse(req, 'support') &&
  (req.user.role === 'superadmin' || !ticket.assignee?.id || ticket.assignee.id === req.user.sub);

/** The ticket in the URL, if it is the caller's or the caller's team may open it. */
async function findTicket(req) {
  const ticket = isId(req.params.id) && (await Ticket.findById(req.params.id));
  if (!ticket || (ticket.userId !== req.user.sub && !teamCanOpen(req, ticket))) throw notFound('Ticket not found');
  return ticket;
}

ticketRoutes.post(
  '/',
  validate(
    z.object({
      subject: z.string().trim().min(3, 'Add a short subject').max(120),
      message: messageBody,
      orderNo: z.number().int().positive().optional(),
      product: z.enum(PRODUCTS.map((p) => p.slug)).optional(),
      priority: z.enum(PRIORITIES).default('medium'),
    }),
  ),
  async (req, res) => {
    const ticket = await Ticket.create({
      ticketNo: (await nextSeq('ticket')) + 10_000_000,
      userId: req.user.sub,
      email: req.user.email,
      subject: req.body.subject,
      orderNo: req.body.orderNo,
      product: req.body.product,
      priority: req.body.priority,
      messages: [{from: 'customer', body: req.body.message}],
    });
    triage(ticket); // in the background
    res.status(201).json({data: ticket});
  },
);

ticketRoutes.get('/', async (req, res) => {
  res.json({data: await Ticket.find({userId: req.user.sub}, {messages: 0, notes: 0}).sort({updatedAt: -1}).limit(100)});
});

/** Staff see team notes on other people's tickets; customers never do. */
const forCaller = (req, ticket) => {
  const t = ticket.toObject();
  if (t.userId === req.user.sub || !canUse(req, 'support')) delete t.notes;
  return t;
};

ticketRoutes.get('/:id', async (req, res) => res.json({data: forCaller(req, await findTicket(req))}));

ticketRoutes.post('/:id/messages', validate(z.object({body: messageBody})), async (req, res) => {
  const ticket = await findTicket(req);
  // A staff member replying to someone else's ticket speaks for Pirento; on their own ticket they are a customer.
  const from = canUse(req, 'support') && ticket.userId !== req.user.sub ? 'staff' : 'customer';
  const updated = await Ticket.findByIdAndUpdate(
    ticket._id,
    {$push: {messages: {from, body: req.body.body}}, $set: {status: from === 'staff' ? 'answered' : 'open'}},
    {new: true},
  );
  if (from === 'staff') {
    audit(req, 'ticket.reply', `#${ticket.ticketNo ?? ticket._id}`);
    notify(ticket.userId, {
      brand: getProduct(ticket.product ?? '')?.name,
      label: `Support request #${ticket.ticketNo}`,
      big: 'New reply',
      note: `The team answered "${ticket.subject}". Open Support in your dashboard to read it and reply.`,
    });
  }
  res.json({data: forCaller(req, updated)});
});

ticketRoutes.post('/:id/close', async (req, res) => {
  const ticket = await findTicket(req);
  res.json({data: forCaller(req, await Ticket.findByIdAndUpdate(ticket._id, {status: 'closed'}, {new: true}))});
});

/** Staff only, on someone else's ticket. */
async function staffTicket(req) {
  const ticket = await findTicket(req);
  if (!canUse(req, 'support') || ticket.userId === req.user.sub) throw notFound('Ticket not found');
  return ticket;
}

ticketRoutes.post('/:id/notes', validate(z.object({body: z.string().trim().min(2).max(2000)})), async (req, res) => {
  const ticket = await staffTicket(req);
  const updated = await Ticket.findByIdAndUpdate(
    ticket._id,
    {$push: {notes: {by: req.user.email, body: req.body.body}}},
    {new: true},
  );
  audit(req, 'ticket.note', `#${ticket.ticketNo}`);
  res.json({data: forCaller(req, updated)});
});

ticketRoutes.patch(
  '/:id/assign',
  validate(z.object({assignee: z.object({id: z.string().min(1).max(40), email: z.email()}).nullable()})),
  async (req, res) => {
    const ticket = await staffTicket(req);
    const {assignee} = req.body;
    if (assignee && assignee.id !== req.user.sub && req.user.role !== 'superadmin') {
      throw new ApiError(403, 'FORBIDDEN', 'Only a superadmin can assign a ticket to someone else');
    }
    const updated = await Ticket.findByIdAndUpdate(
      ticket._id,
      assignee ? {$set: {assignee}} : {$unset: {assignee: 1}},
      {new: true},
    );
    audit(req, 'ticket.assign', `#${ticket.ticketNo}`, assignee?.email ?? 'unassigned');
    res.json({data: forCaller(req, updated)});
  },
);
