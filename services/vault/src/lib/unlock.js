// Bharat ID confirmation for the vault: the owner types their Bharat ID PIN once and gets an unlock that lasts ten
// minutes, sent back in the x-vault-unlock header. Every opening, change and permission needs it. The unlock is an
// HMAC-signed note of who and until when, so no database read is needed to check it.
import crypto from 'node:crypto';
import {ApiError, callService, jwtSecret} from '@pirento/shared/server';
import {config} from '../config.js';

const TEN_MIN = 10 * 60_000;
const sign = (body) => crypto.createHmac('sha256', `${jwtSecret()}:vault-unlock`).update(body).digest('base64url');

/** Checks the PIN with the identity service (its lockout applies) and returns an unlock for `userId`. */
export async function unlockWith(userId, pin) {
  await callService(config.identityUrl, '/internal/pin-verify', {userId, pin});
  const body = Buffer.from(JSON.stringify({sub: userId, until: Date.now() + TEN_MIN})).toString('base64url');
  return {unlock: `${body}.${sign(body)}`, until: new Date(Date.now() + TEN_MIN)};
}

/** True when `token` is a live unlock for `userId`. */
export function unlocked(userId, token) {
  const [body, mac] = String(token ?? '').split('.');
  if (!body || !mac) return false;
  const want = Buffer.from(sign(body));
  const got = Buffer.from(mac);
  if (want.length !== got.length || !crypto.timingSafeEqual(want, got)) return false;
  try {
    const {sub, until} = JSON.parse(Buffer.from(body, 'base64url').toString());
    return sub === userId && until > Date.now();
  } catch {
    return false;
  }
}

/** Route guard: the request must carry the owner's live unlock. */
export function requireUnlock(req, _res, next) {
  if (unlocked(req.user.sub, req.headers['x-vault-unlock'])) return next();
  next(new ApiError(403, 'VAULT_LOCKED', 'Confirm with your Bharat ID PIN first'));
}
