// Every change to a wallet balance goes through here, in paise.
import {ApiError} from '@pirento/shared/server';
import {Wallet} from '../models/Wallet.js';
import {Transaction} from '../models/Transaction.js';

/**
 * Moves money in or out of one wallet. Amounts are paise.
 *
 * The whole move is one atomic update. A debit only matches a wallet whose
 * balance covers it, so two debits racing each other can never overdraw. When
 * a `ref` is given (an order id, a refund id) the move happens at most once,
 * however many times the caller retries.
 */
export async function move(userId, type, amount, note, ref) {
  const filter = {userId};
  if (type === 'debit') filter.balance = {$gte: amount};
  if (ref) filter.refs = {$ne: ref};

  const update = {$inc: {balance: type === 'debit' ? -amount : amount}};
  if (ref) update.$push = {refs: ref};

  let wallet = null;
  try {
    wallet = await Wallet.findOneAndUpdate(filter, update, {new: true, upsert: type === 'credit'});
  } catch (err) {
    // A credit upsert collides with a wallet that already holds this ref: it was applied before.
    if (err.code !== 11000) throw err;
  }

  if (!wallet && ref) {
    const applied = await Wallet.findOne({userId, refs: ref});
    if (applied) {
      // Done on an earlier try. Make sure its ledger row exists, then report success.
      await Transaction.updateOne(
        {ref},
        {$setOnInsert: {userId, type, amount, balanceAfter: applied.balance, note}},
        {upsert: true},
      );
      return applied;
    }
  }
  if (!wallet) throw new ApiError(400, 'INSUFFICIENT_BALANCE', 'Your wallet balance is too low');

  await Transaction.create({userId, type, amount, balanceAfter: wallet.balance, note, ref});
  return wallet;
}
