// The Bharat ID PIN: hashed with scrypt, checked with the date of birth, locked for a while after wrong tries.
import crypto from 'node:crypto';
import {promisify} from 'node:util';
import {ApiError} from '@pirento/shared/server';
import {Identity} from '../models/Identity.js';

const scrypt = promisify(crypto.scrypt);
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60_000;

export async function hashPin(pin) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = (await scrypt(String(pin), salt, 32)).toString('hex');
  return ['scrypt', salt, hash].join(':');
}

async function pinMatches(pin, stored) {
  const [, salt, hash] = String(stored ?? '').split(':');
  if (!salt || !hash) return false;
  const got = await scrypt(String(pin), salt, 32);
  return crypto.timingSafeEqual(got, Buffer.from(hash, 'hex'));
}

/** True when `pin` is this application's PIN (no lockout counting; for changing the PIN while signed in). */
export const samePin = (doc, pin) => pinMatches(pin, doc.pin?.hash);

/** Counts a wrong try, locking the PIN after 5 in a row (one atomic update, so parallel guesses count). */
async function countFail(doc) {
  const after = await Identity.findOneAndUpdate({_id: doc._id}, {$inc: {'pin.fails': 1}}, {new: true});
  if (after.pin.fails >= MAX_FAILS) {
    await Identity.updateOne(
      {_id: doc._id},
      {$set: {'pin.fails': 0, 'pin.lockedUntil': new Date(Date.now() + LOCK_MS)}},
    );
  }
}

/** The shared check: refuses a locked PIN, clears the count on success, counts a failure. */
async function guarded(doc, pin, alsoOk, refuse) {
  if (!doc?.pin?.hash) throw refuse();
  if (doc.pin.lockedUntil && doc.pin.lockedUntil > new Date()) {
    throw new ApiError(429, 'PIN_LOCKED', 'Too many wrong tries. Try again in 15 minutes.');
  }
  if ((await pinMatches(pin, doc.pin.hash)) && alsoOk) {
    if (doc.pin.fails)
      await Identity.updateOne({_id: doc._id}, {$set: {'pin.fails': 0}, $unset: {'pin.lockedUntil': 1}});
    return doc;
  }
  await countFail(doc);
  throw refuse();
}

/**
 * Checks an issued Bharat ID's PIN and date of birth. Every failure looks the same to the caller. After 5 wrong
 * tries in a row the PIN locks for 15 minutes.
 */
export async function checkPin(bharatId, pin, dob) {
  const doc = await Identity.findOne({bharatId, status: 'approved'});
  return guarded(
    doc,
    pin,
    doc?.sections?.personal?.dob === dob,
    () => new ApiError(401, 'PIN_WRONG', 'Wrong Bharat ID, PIN or date of birth'),
  );
}

/** Checks the PIN of the account's own issued Bharat ID, for an action that must be confirmed (Pirento Vault). */
export async function checkOwnPin(userId, pin) {
  const doc = await Identity.findOne({userId, status: 'approved'});
  return guarded(doc, pin, true, () => new ApiError(401, 'PIN_WRONG', 'That is not your Bharat ID PIN'));
}
