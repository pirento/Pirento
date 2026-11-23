// Checking a Google sign-in token before trusting it: its RS256 signature against Google's published keys, then
// who it is for, who issued it, when it expires and that the email is verified.
import crypto from 'node:crypto';
import {ApiError} from '@pirento/shared/server';

const ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];
const CERTS = 'https://www.googleapis.com/oauth2/v3/certs';
const invalid = (message = 'Google sign-in could not be confirmed. Try again.') =>
  new ApiError(401, 'GOOGLE_INVALID', message);

// Google rotates its keys every few days and says how long to keep them (Cache-Control max-age).
let keys = {byKid: new Map(), until: 0};

async function keyFor(kid, fetchImpl) {
  if (Date.now() > keys.until || !keys.byKid.has(kid)) {
    const res = await fetchImpl(CERTS, {signal: AbortSignal.timeout(8000)}).catch(() => null);
    if (!res?.ok) throw invalid();
    const {keys: list = []} = await res.json();
    const maxAge = Number(/max-age=(\d+)/.exec(res.headers?.get?.('cache-control') ?? '')?.[1] ?? 3600);
    keys = {
      byKid: new Map(list.map((jwk) => [jwk.kid, crypto.createPublicKey({key: jwk, format: 'jwk'})])),
      until: Date.now() + maxAge * 1000,
    };
  }
  return keys.byKid.get(kid) ?? null;
}

const part = (s) => JSON.parse(Buffer.from(s, 'base64url').toString('utf8'));

/** The profile in a Google Identity Services ID token, once it is proven to be for our client id. */
export async function verifyGoogleIdToken(idToken, clientId, fetchImpl = fetch) {
  const [head, body, signature] = String(idToken).split('.');
  let header, info;
  try {
    header = part(head);
    info = part(body);
  } catch {
    throw invalid();
  }
  if (header.alg !== 'RS256' || !signature) throw invalid();
  const key = await keyFor(header.kid, fetchImpl);
  const signed =
    key && crypto.verify('RSA-SHA256', Buffer.from(`${head}.${body}`), key, Buffer.from(signature, 'base64url'));
  if (!signed || info.aud !== clientId || !ISSUERS.includes(info.iss)) throw invalid();
  if (Number(info.exp) * 1000 < Date.now()) throw invalid('That Google sign-in expired. Try again.');
  if (info.email_verified !== true && info.email_verified !== 'true') {
    throw new ApiError(401, 'GOOGLE_UNVERIFIED', 'Your Google email is not verified.');
  }
  return {googleId: String(info.sub), email: String(info.email).toLowerCase(), name: info.name ?? ''};
}

/** For tests: forget the cached keys. */
export const resetGoogleKeys = () => {
  keys = {byKid: new Map(), until: 0};
};
