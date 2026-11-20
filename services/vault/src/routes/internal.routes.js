import {Router} from 'express';
import {z} from 'zod';
import {requireInternal, validate} from '@pirento/shared/server';
import {Credential} from '../models/Credential.js';
import {VaultFile} from '../models/VaultFile.js';

// Called by the auth service when an account is deleted: remove everything this service keeps about it.
export const internalRoutes = Router();
internalRoutes.use('/internal', requireInternal);

internalRoutes.post('/internal/forget', validate(z.object({userId: z.string().min(1).max(40)})), async (req, res) => {
  const {userId} = req.body;
  await Promise.all([Credential.deleteMany({userId}), VaultFile.deleteMany({userId})]);
  res.json({data: {forgotten: true}});
});
