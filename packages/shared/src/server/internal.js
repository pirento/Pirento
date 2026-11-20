import crypto from 'node:crypto';
import {env} from './env.js';
import {ApiError} from './errors.js';

// Services talk to each other on /internal/* routes, signed with a shared key.
// The gateway refuses those paths from outside, and the key is a second lock.
const internalKey = () => env('INTERNAL_KEY', 'dev-only-internal-key');

/** Constant-time string comparison, for keys and signatures. */
export function safeEqual(a, b) {
  const x = Buffer.from(String(a ?? ''));
  const y = Buffer.from(String(b ?? ''));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export function requireInternal(req, _res, next) {
  if (safeEqual(req.headers['x-internal-key'], internalKey())) return next();
  next(new ApiError(403, 'FORBIDDEN', 'Internal route'));
}

/** POST to another service's /internal route. Throws that service's error if it refuses. */
export async function callService(baseUrl, path, body) {
  const res = await fetch(baseUrl + path, {
    method: 'POST',
    headers: {'content-type': 'application/json', 'x-internal-key': internalKey()},
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, json.error?.code ?? 'UPSTREAM', json.error?.message ?? 'Service unavailable');
  }
  return json.data;
}
