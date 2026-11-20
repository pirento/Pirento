import {Router} from 'express';
import {STAFF, requireRole} from '@pirento/shared/server';
import {TICKET_STATUSES, Ticket} from '../models/Ticket.js';

// The team's queue. Default: tickets waiting on us, oldest first.
export const staffRoutes = Router();

staffRoutes.get('/staff/queue', requireRole(...STAFF), async (req, res) => {
  const status = TICKET_STATUSES.includes(req.query.status) ? req.query.status : 'open';
  res.json({data: await Ticket.find({status}, {messages: 0}).sort({updatedAt: 1}).limit(200)});
});
