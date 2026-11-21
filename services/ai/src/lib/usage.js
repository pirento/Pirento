// The fair-use count: messages sent per account per day (India time), counted atomically.
import {Usage} from '../models/Usage.js';

/** Today's date in India, so the limit resets at midnight IST. */
export const today = (now = new Date()) => new Date(now.getTime() + 5.5 * 3_600_000).toISOString().slice(0, 10);

/**
 * Takes one message from today's allowance; false when it is used up. One conditional upsert: two requests
 * at once can never both take the last one, and deleting chats does not give the allowance back.
 */
export async function takeOne(userId, limit) {
  try {
    await Usage.findOneAndUpdate({userId, day: today(), n: {$lt: limit}}, {$inc: {n: 1}}, {upsert: true});
    return true;
  } catch (err) {
    // Today's row exists and is full, so the upsert tried to insert a second one.
    if (err.code === 11000) return false;
    throw err;
  }
}

/** Gives a message back when no reply came, so a failure never costs the customer. */
export const giveBack = (userId) => Usage.updateOne({userId, day: today(), n: {$gt: 0}}, {$inc: {n: -1}});
