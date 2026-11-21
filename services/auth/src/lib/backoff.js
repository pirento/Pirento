// Slows down repeated wrong passwords on one account: 1s, 2s, 4s… up to a minute.
// No hard lockout, so nobody can lock a colleague out on purpose.
// Kept in MongoDB so the wait survives restarts and holds across auth instances.
import {LoginFailure} from '../models/LoginFailure.js';

const CAP_MS = 60_000;
const KEEP_MS = 24 * 60 * 60 * 1000;

/** The wait after the nth failure in a row. */
export const delayAfter = (count) => Math.min(1000 * 2 ** (count - 1), CAP_MS);

/** Milliseconds to wait before this key may try again (0 = go ahead). */
export async function waitFor(key, now = Date.now()) {
  const entry = await LoginFailure.findOne({key}).lean();
  return entry ? Math.max(0, entry.notBefore - now) : 0;
}

export async function recordFailure(key, now = Date.now()) {
  // One pipeline update, so parallel wrong tries each count and the wait is computed from the new count.
  await LoginFailure.updateOne(
    {key},
    [
      {$set: {count: {$add: [{$ifNull: ['$count', 0]}, 1]}, expiresAt: new Date(now + KEEP_MS)}},
      {
        $set: {
          notBefore: {$add: [now, {$min: [{$multiply: [1000, {$pow: [2, {$subtract: ['$count', 1]}]}]}, CAP_MS]}]},
        },
      },
    ],
    {upsert: true},
  );
}

export const clearFailures = (keys) => LoginFailure.deleteMany({key: {$in: [keys].flat()}});
