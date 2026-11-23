// Anyone can check a Bharat ID. A mistyped number fails its checksum here,
// before it costs a database lookup.
import {Router} from 'express';
import {isBharatId} from '@pirento/shared';
import {ApiError, notFound} from '@pirento/shared/server';
import {Identity} from '../models/Identity.js';
import {publicName} from '../lib/publicName.js';

export const publicRoutes = Router();

publicRoutes.get('/verify/:bid', async (req, res) => {
  if (!isBharatId(req.params.bid)) throw new ApiError(400, 'INVALID_ID', 'That is not a valid Bharat ID');
  const doc = await Identity.findOne({bharatId: req.params.bid, status: {$in: ['approved', 'suspended']}});
  if (!doc) throw notFound('No Bharat ID with this number');
  // A suspended ID is named as such, so whoever checks it does not trust it; no details leave.
  if (doc.status === 'suspended') throw new ApiError(410, 'SUSPENDED', 'This Bharat ID is suspended');
  res.json({data: {bharatId: doc.bharatId, name: publicName(doc.fullName), state: doc.state, issuedAt: doc.issuedAt}});
});
