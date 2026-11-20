// Keeping a session alive, and ending it.
import {Router} from 'express';
import {ApiError} from '@pirento/shared/server';
import {RefreshToken} from '../models/RefreshToken.js';
import {User} from '../models/User.js';
import {issueSession, readRefreshCookie, setRefreshCookie, sha256} from '../lib/session.js';

export const sessionRoutes = Router();

sessionRoutes.post('/refresh', async (req, res) => {
  const raw = readRefreshCookie(req);
  // Delete on use: a stolen refresh token works at most once, and only until its owner refreshes.
  const old = raw && (await RefreshToken.findOneAndDelete({hash: sha256(raw), expiresAt: {$gt: new Date()}}));
  const user = old && (await User.findById(old.userId));
  if (!user) {
    setRefreshCookie(res, '', 0);
    throw new ApiError(401, 'UNAUTHORIZED', 'Sign in to continue');
  }
  await issueSession(res, user);
});

sessionRoutes.post('/logout', async (req, res) => {
  const raw = readRefreshCookie(req);
  if (raw) await RefreshToken.deleteOne({hash: sha256(raw)});
  setRefreshCookie(res, '', 0);
  res.json({data: {signedOut: true}});
});
