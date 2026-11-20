import {Router} from 'express';
import {z} from 'zod';
import {isId, isStaff, nextSeq, notFound, validate} from '@pirento/shared/server';
import {Ticket} from '../models/Ticket.js';

// Opening a ticket, reading it, replying and closing.
export const ticketRoutes = Router();

const messageBody = z.string().trim().min(2, 'Write a message').max(4000);

/** The ticket in the URL, if it is the caller's or the caller is staff. */
async function findTicket(req) {
  const ticket = isId(req.params.id) && (await Ticket.findById(req.params.id));
  if (!ticket || (ticket.userId !== req.user.sub && !isStaff(req))) throw notFound('Ticket not found');
  return ticket;
}

ticketRoutes.post(
  '/',
  validate(
    z.object({
      subject: z.string().trim().min(3, 'Add a short subject').max(120),
      message: messageBody,
      orderNo: z.number().int().positive().optional(),
    }),
  ),
  async (req, res) => {
    const ticket = await Ticket.create({
      ticketNo: (await nextSeq('ticket')) + 10_000_000,
      userId: req.user.sub,
      email: req.user.email,
      subject: req.body.subject,
      orderNo: req.body.orderNo,
      messages: [{from: 'customer', body: req.body.message}],
    });
    res.status(201).json({data: ticket});
  },
);

ticketRoutes.get('/', async (req, res) => {
  res.json({data: await Ticket.find({userId: req.user.sub}, {messages: 0}).sort({updatedAt: -1}).limit(100)});
});

ticketRoutes.get('/:id', async (req, res) => res.json({data: await findTicket(req)}));

ticketRoutes.post('/:id/messages', validate(z.object({body: messageBody})), async (req, res) => {
  const ticket = await findTicket(req);
  // A staff member replying to someone else's ticket speaks for Pirento; on their own ticket they are a customer.
  const from = isStaff(req) && ticket.userId !== req.user.sub ? 'staff' : 'customer';
  const updated = await Ticket.findByIdAndUpdate(
    ticket._id,
    {$push: {messages: {from, body: req.body.body}}, $set: {status: from === 'staff' ? 'answered' : 'open'}},
    {new: true},
  );
  res.json({data: updated});
});

ticketRoutes.post('/:id/close', async (req, res) => {
  const ticket = await findTicket(req);
  res.json({data: await Ticket.findByIdAndUpdate(ticket._id, {status: 'closed'}, {new: true})});
});
