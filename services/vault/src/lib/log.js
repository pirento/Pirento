// The vault's action log: each entry carries the hash of the one before it, so the record of who did what, and
// when, cannot be changed or cut without the chain breaking (checkChain finds where).
import crypto from 'node:crypto';
import {VaultLog} from '../models/VaultLog.js';

const hashOf = (e) =>
  crypto
    .createHash('sha256')
    .update([e.prev ?? '', e.userId, e.at.toISOString(), e.by, e.action, e.target ?? '', e.pin ? 1 : 0].join('|'))
    .digest('hex');

/** Adds an entry to a person's log. `by`: owner, nominee, staff or system; `pin`: confirmed with the Bharat ID PIN. */
export async function logAction(userId, action, {target, by = 'owner', pin = false} = {}) {
  const last = await VaultLog.findOne({userId}, {hash: 1}).sort({at: -1, _id: -1}).lean();
  const entry = {userId, at: new Date(), by, action, target: target ? String(target).slice(0, 120) : undefined, pin};
  entry.prev = last?.hash;
  entry.hash = hashOf(entry);
  return VaultLog.create(entry);
}

/** Walks a log in order; returns the index of the first entry that does not match, or -1 when the chain holds. */
export function checkChain(entries) {
  let prev;
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if ((e.prev ?? undefined) !== prev || hashOf(e) !== e.hash) return i;
    prev = e.hash;
  }
  return -1;
}
