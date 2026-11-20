import {Router} from 'express';
import {z} from 'zod';
import {requireInternal, validate} from '@pirento/shared/server';
import {Ticket} from '../models/Ticket.js';

// Called by the auth service when an account is deleted. Tickets stay as a record of the work,
// but the person's email and everything they wrote are removed.
export const internalRoutes = Router();
internalRoutes.use('/internal', requireInternal);

internalRoutes.post('/internal/forget', validate(z.object({userId: z.string().min(1).max(40)})), async (req, res) => {
  const {userId} = req.body;
  await Ticket.updateMany(
    {userId},
    {$set: {email: `deleted-${userId}@deleted.invalid`, 'messages.$[mine].body': '[removed when the account was deleted]'}},
    {arrayFilters: [{'mine.from': 'customer'}]},
  );
  res.json({data: {forgotten: true}});
});
