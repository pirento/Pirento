// Connecting a service to its own database and starting it.
import mongoose from 'mongoose';

/** Connects to the service's own database (if it has one) and starts listening. */
export async function start(app, {name, port, mongoUri}) {
  if (mongoUri) await mongoose.connect(mongoUri);
  app.listen(port, () => console.log(`${name} listening on :${port}`));
}

/**
 * Next number in a named sequence (order numbers, ticket numbers, Bharat IDs).
 * One atomic $inc per call, so two requests can never get the same number,
 * and a number is never handed out twice even after the row it named is gone.
 */
let Counter;
export async function nextSeq(name) {
  Counter ??= mongoose.model('Counter', new mongoose.Schema({_id: String, seq: Number}));
  const doc = await Counter.findOneAndUpdate({_id: name}, {$inc: {seq: 1}}, {upsert: true, new: true});
  return doc.seq;
}

/** True when `id` could be a Mongo id; saves a query (and a cast error) on junk. */
export const isId = (id) => mongoose.isValidObjectId(id);

/**
 * A staff search box as a Mongo filter: a number finds that record number, anything else matches the text
 * fields case-insensitively (escaped, so a user's "." or "(" is literal). null for an empty search.
 */
export function searchFilter(q, numberField, textFields) {
  const text = String(q ?? '')
    .trim()
    .replace(/^#/, '')
    .slice(0, 80);
  if (!text) return null;
  if (numberField && /^\d+$/.test(text)) return {[numberField]: Number(text)};
  const match = {$regex: text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i'};
  return {$or: textFields.map((f) => ({[f]: match}))};
}
