import {Router} from 'express';
import {isBharatId} from '@pirento/shared';
import {ApiError, notFound} from '@pirento/shared/server';
import {Identity} from '../models/Identity.js';
import {publicName} from '../lib/publicName.js';

// Anyone can check a Bharat ID. A mistyped number fails its checksum here,
// before it costs a database lookup.
export const publicRoutes = Router();

publicRoutes.get('/verify/:bid', async (req, res) => {
  if (!isBharatId(req.params.bid)) throw new ApiError(400, 'INVALID_ID', 'That is not a valid Bharat ID');
  const doc = await Identity.findOne({bharatId: req.params.bid, status: 'approved'});
  if (!doc) throw notFound('No Bharat ID with this number');
  res.json({data: {bharatId: doc.bharatId, name: publicName(doc.fullName), state: doc.state, issuedAt: doc.issuedAt}});
});
