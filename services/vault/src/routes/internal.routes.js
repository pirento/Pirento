// Called by the auth service when an account is deleted: remove everything this service keeps about it.
import {Router} from 'express';
import {z} from 'zod';
import {dropFiles, isProduction, requireInternal, validate} from '@pirento/shared/server';
import {runCheckins} from '../lib/checkin.js';
import {Credential} from '../models/Credential.js';
import {VaultFile} from '../models/VaultFile.js';
import {VaultUsage} from '../models/VaultUsage.js';
import {Record} from '../models/Record.js';
import {Legacy} from '../models/Legacy.js';
import {VaultLog} from '../models/VaultLog.js';

export const internalRoutes = Router();
internalRoutes.use('/internal', requireInternal);

internalRoutes.post('/internal/forget', validate(z.object({userId: z.string().min(1).max(40)})), async (req, res) => {
  const {userId} = req.body;
  const stored = await VaultFile.find({userId, blobKey: {$exists: true}}, {blobKey: 1}).lean();
  await Promise.all([
    Credential.deleteMany({userId}),
    VaultFile.deleteMany({userId}),
    VaultUsage.deleteMany({userId}),
    Record.deleteMany({userId}),
    Legacy.deleteMany({userId}),
    VaultLog.deleteMany({userId}),
  ]);
  await dropFiles(stored);
  res.json({data: {forgotten: true}});
});

/** Runs the check-in job now. Off production it may run as at a later time, so tests need not wait months. */
internalRoutes.post('/internal/checkins', validate(z.object({at: z.iso.datetime().optional()})), async (req, res) => {
  await runCheckins(req.body.at && !isProduction() ? new Date(req.body.at) : new Date());
  res.json({data: {ran: true}});
});
