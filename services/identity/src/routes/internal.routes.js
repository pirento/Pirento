// Called by other services: forget a deleted account, find who holds an issued Bharat ID, and whether someone has one.
import {Router} from 'express';
import {z} from 'zod';
import {notFound, requireInternal, validate} from '@pirento/shared/server';
import {Identity} from '../models/Identity.js';
import {checkPin} from '../lib/pin.js';
import {KycVideo} from '../models/KycVideo.js';
import {ApiKey} from '../models/ApiKey.js';
import {Business} from '../models/Business.js';
import {Consent} from '../models/Consent.js';
import {AccessLog} from '../models/AccessLog.js';
import {AuthSession} from '../models/AuthSession.js';

export const internalRoutes = Router();
internalRoutes.use('/internal', requireInternal);

internalRoutes.post('/internal/forget', validate(z.object({userId: z.string().min(1).max(40)})), async (req, res) => {
  const {userId} = req.body;
  // A business account closes: its keys stop, its contact details go. Consents given by this person end.
  const businesses = await Business.find({userId}, {_id: 1});
  await Promise.all([
    Identity.deleteOne({userId}),
    KycVideo.deleteOne({userId}),
    ApiKey.updateMany(
      {businessId: {$in: businesses.map((b) => String(b._id))}, revokedAt: null},
      {$set: {revokedAt: new Date()}},
    ),
    Business.updateMany(
      {userId},
      {
        $set: {
          status: 'closed',
          'request.contactName': '',
          'request.email': `deleted-${userId}@deleted.invalid`,
          'request.mobile': '',
        },
        $unset: {open: 1},
      },
    ),
  ]);
  // In order: end them first, then drop the link to the person.
  await Consent.updateMany(
    {userId, status: {$in: ['pending', 'approved']}},
    {$set: {status: 'revoked', decidedAt: new Date()}},
  );
  await Consent.updateMany({userId}, {$unset: {userId: 1}});
  // Checks of this person stay as a business's record, without the link to them.
  await Promise.all([
    AccessLog.updateMany({userId}, {$unset: {userId: 1}}),
    AuthSession.updateMany({userId}, {$unset: {userId: 1}}),
  ]);
  res.json({data: {forgotten: true}});
});

/** Who holds an issued Bharat ID, for signing in with it. Only approved IDs count. */
internalRoutes.post(
  '/internal/owner',
  validate(z.object({bharatId: z.string().regex(/^\d{10}$/)})),
  async (req, res) => {
    const doc = await Identity.findOne({bharatId: req.body.bharatId, status: 'approved'}, {userId: 1});
    if (!doc) throw notFound('No issued Bharat ID has that number');
    res.json({data: {userId: doc.userId}});
  },
);

/** Whether this account holds an issued Bharat ID (Pirento One and Vault need one). */
internalRoutes.post('/internal/issued', validate(z.object({userId: z.string().min(1).max(40)})), async (req, res) => {
  res.json({data: {issued: Boolean(await Identity.exists({userId: req.body.userId, status: 'approved'}))}});
});

/** Pirento sign-in with Bharat ID, PIN and date of birth: the account behind it, or the same refusal for any failure. */
internalRoutes.post(
  '/internal/pin-check',
  validate(z.object({bharatId: z.string().regex(/^\d{10}$/), pin: z.string().max(6), dob: z.string().max(10)})),
  async (req, res) => {
    const doc = await checkPin(req.body.bharatId, req.body.pin, req.body.dob);
    res.json({data: {userId: doc.userId}});
  },
);
