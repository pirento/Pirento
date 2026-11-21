// The team's queue. Default: tickets waiting on us, oldest first.
import {Router} from 'express';
import {ACCESS, productScope, requireRole} from '@pirento/shared/server';
import {PRIORITIES, TICKET_STATUSES, Ticket} from '../models/Ticket.js';
import {PRODUCTS} from '@pirento/shared';

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
  // One product's tickets, inside the scope: ?product=legal, or ?product=none for account questions.
  const asked = req.query.product;
  // `null` matches tickets with no product; a scoped staffer has no account questions to see.
  if (asked === 'none') filter.product = scope ? {$in: []} : null;
  else if (PRODUCTS.some((p) => p.slug === asked) && (!scope || scope.includes(asked))) filter.product = asked;
  // High priority first, then the longest waiting. Ranked in the database so the 200 cap never hides a new urgent one.
  const tickets = await Ticket.aggregate([
    {$match: filter},
    {$addFields: {rank: {$indexOfArray: [PRIORITIES, {$ifNull: ['$priority', 'medium']}]}}},
    {$sort: {rank: -1, updatedAt: 1}},
    {$limit: 200},
    {$project: {messages: 0, notes: 0, rank: 0}},
  ]);
  res.json({data: tickets});
});

/** Every ticket with one subject, any status: the Capital waitlist is kept this way. */
staffRoutes.get('/staff/subject', requireRole(...ACCESS.support), async (req, res) => {
  const subject = String(req.query.q ?? '').slice(0, 120);
  res.json({data: await Ticket.find({subject}, {notes: 0}).sort({createdAt: -1}).limit(500)});
});
