// Called by the auth service when an account is deleted. Tickets stay as a record of the work,
// but the person's email and everything they wrote are removed, and so are their contact-form enquiries.
import {Router} from 'express';
import {z} from 'zod';
import {requireInternal, validate} from '@pirento/shared/server';
import {Ticket} from '../models/Ticket.js';
import {Enquiry} from '../models/Enquiry.js';

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
