import {Router} from 'express';
import {z} from 'zod';
import {requireInternal, validate} from '@pirento/shared/server';
import {Attempt} from '../models/Attempt.js';
import {Certificate} from '../models/Certificate.js';
import {Application} from '../models/Application.js';

// Called by the auth service when an account is deleted: remove everything this service keeps about it.
export const internalRoutes = Router();
internalRoutes.use('/internal', requireInternal);

internalRoutes.post('/internal/forget', validate(z.object({userId: z.string().min(1).max(40)})), async (req, res) => {
  const {userId} = req.body;
  await Promise.all([Attempt.deleteMany({userId}), Certificate.deleteMany({userId}), Application.deleteMany({userId})]);
  res.json({data: {forgotten: true}});
});
