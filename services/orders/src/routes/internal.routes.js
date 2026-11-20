import {Router} from 'express';
import {z} from 'zod';
import {requireInternal, validate} from '@pirento/shared/server';
import {Order} from '../models/Order.js';
import {Partner} from '../models/Partner.js';

// Called by the auth service when an account is deleted. Orders stay for accounts and tax records,
// but without the person: their email and their answers to the checkout questions go.
export const internalRoutes = Router();
internalRoutes.use('/internal', requireInternal);

internalRoutes.post('/internal/forget', validate(z.object({userId: z.string().min(1).max(40)})), async (req, res) => {
  const {userId} = req.body;
  await Promise.all([
    Order.updateMany({userId}, {$set: {email: `deleted-${userId}@deleted.invalid`, intake: {}}}),
    Partner.deleteMany({userId}),
  ]);
  res.json({data: {forgotten: true}});
});
