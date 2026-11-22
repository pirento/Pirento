// Called by other services: forget a deleted account, find who holds an issued Bharat ID, and whether someone has one.
import {Router} from 'express';
import {z} from 'zod';
import {notFound, requireInternal, validate} from '@pirento/shared/server';
import {Identity} from '../models/Identity.js';
import {KycVideo} from '../models/KycVideo.js';

export const internalRoutes = Router();
internalRoutes.use('/internal', requireInternal);

internalRoutes.post('/internal/forget', validate(z.object({userId: z.string().min(1).max(40)})), async (req, res) => {
  const {userId} = req.body;
  await Promise.all([Identity.deleteOne({userId}), KycVideo.deleteOne({userId})]);
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
