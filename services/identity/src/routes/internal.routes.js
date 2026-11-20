// Called by the auth service: forget a deleted account, and find who holds an issued Bharat ID.
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
