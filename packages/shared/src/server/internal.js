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

/**
 * Records a staff action in the audit trail kept by the auth service.
 * Never fails the request it describes: a lost audit row is logged, not thrown.
 */
export function audit(req, action, target, detail = '') {
  const row = {actorId: req.user.sub, actorEmail: req.user.email, action, target: String(target), detail};
  return callService(env('AUTH_URL', 'http://127.0.0.1:4001'), '/internal/audit', row).catch((err) =>
    console.error('audit lost', action, err.message),
  );
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
