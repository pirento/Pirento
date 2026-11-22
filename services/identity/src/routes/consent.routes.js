// The Bharat ID holder's side of business consents: see who asked for what, allow or decline it, revoke it later.
import {Router} from 'express';
import {z} from 'zod';
import {conflict, isId, notFound, requireAuth, validate} from '@pirento/shared/server';
import {AccessLog} from '../models/AccessLog.js';
import {Consent} from '../models/Consent.js';

export const consentRoutes = Router();
consentRoutes.use('/consents', requireAuth);

consentRoutes.get('/consents', async (req, res) => {
  res.json({data: await Consent.find({userId: req.user.sub, mode: 'live'}).sort({createdAt: -1}).limit(200)});
});

// Each decision moves from one status only, in one conditional update, so a double click decides once.
const MOVES = {approve: ['pending', 'approved'], decline: ['pending', 'declined'], revoke: ['approved', 'revoked']};

consentRoutes.post('/consents/:id', validate(z.object({decision: z.enum(Object.keys(MOVES))})), async (req, res) => {
  if (!isId(req.params.id)) throw notFound('No such request');
  const [from, to] = MOVES[req.body.decision];
  const consent = await Consent.findOneAndUpdate(
    {_id: req.params.id, userId: req.user.sub, status: from},
    {$set: {status: to, decidedAt: new Date()}},
    {new: true},
  );
  if (!consent) {
    if (!(await Consent.exists({_id: req.params.id, userId: req.user.sub}))) throw notFound('No such request');
    throw conflict('CHANGED', 'This request was already decided');
  }
  res.json({data: consent});
});

/** Every live check of your Bharat ID by a business: who, what and when (never the details themselves). */
consentRoutes.get('/consents/log', async (req, res) => {
  res.json({
    data: await AccessLog.find({userId: req.user.sub, mode: 'live'}, {ip: 0, userId: 0})
      .sort({createdAt: -1})
      .limit(200),
  });
});
