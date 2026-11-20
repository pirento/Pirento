import {Router} from 'express';
import {ACCESS, requireAuth, requireRole} from '@pirento/shared/server';
import {Certificate} from '../models/Certificate.js';

// Staff: every certificate issued, newest first, optionally for one track.
export const staffRoutes = Router();
staffRoutes.use('/staff', requireAuth, requireRole(...ACCESS.learning));

staffRoutes.get('/staff/certificates', async (req, res) => {
  const filter = typeof req.query.track === 'string' && req.query.track ? {track: req.query.track} : {};
  res.json({data: await Certificate.find(filter).sort({issuedAt: -1}).limit(300)});
});
