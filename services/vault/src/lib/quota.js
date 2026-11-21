// The vault quota: room is taken before a file is stored and given back when it is deleted.
import {VaultFile} from '../models/VaultFile.js';
import {VaultUsage} from '../models/VaultUsage.js';

/** First use for someone who had files before the counter existed: start it at what they already keep. */
async function seed(userId) {
  if (await VaultUsage.exists({userId})) return;
  const [{used = 0} = {}] = await VaultFile.aggregate([
    {$match: {userId}},
    {$group: {_id: null, used: {$sum: '$size'}}},
  ]);
  await VaultUsage.updateOne({userId}, {$setOnInsert: {used}}, {upsert: true}).catch((err) => {
    if (err.code !== 11000) throw err; // another request seeded it first
  });
}

/** Takes `bytes` of room; false when the vault would go over the quota. Two uploads at once cannot both fit. */
export async function takeRoom(userId, bytes, quota) {
  await seed(userId);
  return Boolean(await VaultUsage.findOneAndUpdate({userId, used: {$lte: quota - bytes}}, {$inc: {used: bytes}}));
}

export const giveRoom = (userId, bytes) => VaultUsage.updateOne({userId}, {$inc: {used: -bytes}});
