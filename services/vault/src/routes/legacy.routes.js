// The owner's legacy plan: consent to release chosen items to their Bharat ID nominee after a verified death, the
// check-in that watches for a quiet account, "I am here", the nominee and emergency contact (from Bharat ID), and
// the owner's own action log.
import {Router} from 'express';
import {z} from 'zod';
import {LEGACY} from '@pirento/shared';
import {conflict, validate} from '@pirento/shared/server';
import {Legacy} from '../models/Legacy.js';
import {Record} from '../models/Record.js';
import {Credential} from '../models/Credential.js';
import {VaultFile} from '../models/VaultFile.js';
import {VaultLog} from '../models/VaultLog.js';
import {maskedContacts} from '../lib/contacts.js';
import {checkChain, logAction} from '../lib/log.js';
import {requireUnlock} from '../lib/unlock.js';

export const legacyRoutes = Router();

/** The plan, the contacts it will use, and how many items are set to go to the nominee. */
legacyRoutes.get('/legacy', async (req, res) => {
  const userId = req.user.sub;
  const [plan, contacts, records, credentials, files] = await Promise.all([
    Legacy.findOne({userId}, {userId: 1, consentAt: 1, lastSeenAt: 1, stage: 1, reminders: 1, remindedAt: 1}).lean(),
    maskedContacts(userId),
    Record.countDocuments({userId, release: true}),
    Credential.countDocuments({userId, release: true}),
    VaultFile.countDocuments({userId, release: true}),
  ]);
  res.json({data: {plan, contacts, releasing: {records, credentials, files}, rules: LEGACY}});
});

/** Turns the plan on: the owner agrees, with their PIN, that chosen items go to their nominee after a verified death. */
legacyRoutes.post('/legacy', requireUnlock, validate(z.object({consent: z.literal(true)})), async (req, res) => {
  const now = new Date();
  const plan = await Legacy.findOneAndUpdate(
    {userId: req.user.sub},
    {$setOnInsert: {userId: req.user.sub, stage: 'active'}, $set: {consentAt: now, lastSeenAt: now}},
    {upsert: true, new: true},
  );
  await logAction(req.user.sub, 'legacy.on', {pin: true});
  res.status(201).json({data: plan});
});

/** Turns the plan off, while no death certificate has been verified. */
legacyRoutes.delete('/legacy', requireUnlock, async (req, res) => {
  const done = await Legacy.deleteOne({
    userId: req.user.sub,
    stage: {$in: ['active', 'reminding', 'call-nominee', 'nominee-reached']},
  });
  if (!done.deletedCount) throw conflict('LEGACY_LOCKED', 'This plan can no longer be turned off');
  await logAction(req.user.sub, 'legacy.off', {pin: true});
  res.json({data: {deleted: true}});
});

/** The owner's log, newest first, and whether its chain is whole. */
legacyRoutes.get('/log', async (req, res) => {
  const all = await VaultLog.find({userId: req.user.sub}).sort({at: 1, _id: 1}).lean();
  const broken = checkChain(all);
  res.json({
    data: {
      intact: broken === -1,
      items: all
        .slice(-100)
        .reverse()
        .map(({at, by, action, target, pin, hash}) => ({at, by, action, target, pin, hash})),
    },
  });
});
