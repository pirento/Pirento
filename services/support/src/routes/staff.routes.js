import {Router} from 'express';
import {ACCESS, requireRole} from '@pirento/shared/server';
import {TICKET_STATUSES, Ticket} from '../models/Ticket.js';

// The team's queue. Default: tickets waiting on us, oldest first.
export const staffRoutes = Router();

staffRoutes.get('/staff/queue', requireRole(...ACCESS.support), async (req, res) => {
  const filter = {status: TICKET_STATUSES.includes(req.query.status) ? req.query.status : 'open'};
  if (req.query.mine === '1') filter['assignee.id'] = req.user.sub;
  res.json({data: await Ticket.find(filter, {messages: 0, notes: 0}).sort({updatedAt: 1}).limit(200)});
});

/** Every ticket with one subject, any status: the Capital waitlist is kept this way. */
staffRoutes.get('/staff/subject', requireRole(...ACCESS.support), async (req, res) => {
  const subject = String(req.query.q ?? '').slice(0, 120);
  res.json({data: await Ticket.find({subject}, {notes: 0}).sort({createdAt: -1}).limit(500)});
});
