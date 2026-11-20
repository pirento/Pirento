// Staff passwords, hashed with scrypt (built into Node, so no native module to install).
// Stored as "scrypt$<salt>$<hash>", both base64url.
import crypto from 'node:crypto';
import {promisify} from 'node:util';

const scrypt = promisify(crypto.scrypt);
const KEYLEN = 64;

export const MIN_PASSWORD = 10;

export async function hashPassword(plain) {
  const salt = crypto.randomBytes(16);
  const hash = await scrypt(plain, salt, KEYLEN);
  return `scrypt$${salt.toString('base64url')}$${hash.toString('base64url')}`;
}

export async function verifyPassword(plain, stored) {
  const [kind, salt, hash] = String(stored ?? '').split('$');
  if (kind !== 'scrypt' || !salt || !hash) return false;
  const given = await scrypt(plain, Buffer.from(salt, 'base64url'), KEYLEN);
  const want = Buffer.from(hash, 'base64url');
  return want.length === given.length && crypto.timingSafeEqual(want, given);
}
