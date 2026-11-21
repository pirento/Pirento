// Called by the auth service when an account is deleted: remove everything this service keeps about it.
import {Router} from 'express';
import {z} from 'zod';
import {requireInternal, validate} from '@pirento/shared/server';
import {Chat} from '../models/Chat.js';
import {Usage} from '../models/Usage.js';

export const internalRoutes = Router();
internalRoutes.use('/internal', requireInternal);

internalRoutes.post('/internal/forget', validate(z.object({userId: z.string().min(1).max(40)})), async (req, res) => {
  const {userId} = req.body;
  await Promise.all([Chat.deleteMany({userId}), Usage.deleteMany({userId})]);
  res.json({data: {forgotten: true}});
});
