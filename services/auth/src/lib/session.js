import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import {jwtSecret} from '@pirento/shared/server';
import {config} from '../config.js';
import {RefreshToken} from '../models/RefreshToken.js';

export const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

/** The refresh token from the request's cookie header, if any. */
export const readRefreshCookie = (req) =>
  (req.headers.cookie ?? '')
    .split(';')
    .map((c) => c.trim().split('='))
    .find(([k]) => k === config.refreshCookie)?.[1];

// Scoped to /api/auth so the cookie is never sent to any other service.
export function setRefreshCookie(res, value, maxAgeSec) {
  const secure = config.isProduction ? '; Secure' : '';
  res.setHeader(
    'set-cookie',
    `${config.refreshCookie}=${value}; Path=/api/auth; HttpOnly; SameSite=Strict; Max-Age=${maxAgeSec}${secure}`,
  );
}

/**
 * Signs a user in: a 15-minute access token in the body, and a fresh 30-day
 * refresh token in an httpOnly cookie the page itself cannot read.
 */
export async function issueSession(res, user) {
  const refresh = crypto.randomBytes(32).toString('base64url');
  await RefreshToken.create({
    userId: String(user._id),
    hash: sha256(refresh),
    expiresAt: new Date(Date.now() + config.refreshDays * 86_400_000),
  });
  setRefreshCookie(res, refresh, config.refreshDays * 86_400);

  const claims = {sub: String(user._id), email: user.email, role: user.role};
  const token = jwt.sign(claims, jwtSecret(), {expiresIn: config.accessTokenLife});
  res.json({data: {token, user}});
}

/** Ends every session of a user (role change, account lock). */
export const endAllSessions = (userId) => RefreshToken.deleteMany({userId: String(userId)});
