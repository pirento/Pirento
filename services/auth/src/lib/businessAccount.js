// A sign-in for an approved Bharat ID for Business customer: a free user ID from their email and a random first password.
import crypto from 'node:crypto';
import {isUsername, passwordProblem} from '@pirento/shared';
import {User} from '../models/User.js';

/** "Asha.Rao+kyc@bank.in" → "asha.rao", then asha.rao2, asha.rao3… until one is free. */
export async function freeUsername(email) {
  let base = email
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/^[^a-z]+/, '')
    .slice(0, 24);
  if (!isUsername(base)) base = `biz${base}`.slice(0, 24).padEnd(3, '0');
  for (let n = 1; n < 1000; n++) {
    const name = n === 1 ? base : `${base}${n}`;
    if (!(await User.exists({username: name}))) return name;
  }
  return `${base}${crypto.randomInt(1e5, 1e6)}`;
}

/** 14 characters with letters and digits, so it passes the password rules. */
export function firstPassword() {
  for (;;) {
    const p = crypto.randomBytes(12).toString('base64url').replace(/[-_]/g, '').slice(0, 14);
    if (p.length === 14 && !passwordProblem(p)) return p;
  }
}
