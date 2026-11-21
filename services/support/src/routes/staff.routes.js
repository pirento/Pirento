// The team's queue. Default: tickets waiting on us, oldest first.
import {Router} from 'express';
import {ACCESS, productScope, requireRole} from '@pirento/shared/server';
import {TICKET_STATUSES, Ticket} from '../models/Ticket.js';

export const staffRoutes = Router();

staffRoutes.get('/staff/queue', requireRole(...ACCESS.support), async (req, res) => {
  const filter = {status: TICKET_STATUSES.includes(req.query.status) ? req.query.status : 'open'};
  if (req.query.mine === '1') filter['assignee.id'] = req.user.sub;
  // Everyone but a superadmin sees their own tickets and the ones nobody has taken yet.
  else if (req.user.role !== 'superadmin')
    filter.$or = [{'assignee.id': req.user.sub}, {'assignee.id': {$exists: false}}];
  // Staff kept to some products see those products' tickets; account questions go to the rest of the team.
  const scope = productScope(req);
  if (scope) filter.product = {$in: scope};
  res.json({data: await Ticket.find(filter, {messages: 0, notes: 0}).sort({updatedAt: 1}).limit(200)});
});

/** Every ticket with one subject, any status: the Capital waitlist is kept this way. */
staffRoutes.get('/staff/subject', requireRole(...ACCESS.support), async (req, res) => {
  const subject = String(req.query.q ?? '').slice(0, 120);
  res.json({data: await Ticket.find({subject}, {notes: 0}).sort({createdAt: -1}).limit(500)});
});
