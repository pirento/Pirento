// Wallet moves for the market. Each carries a ref made from its trade, so a retry moves the money once.
import {callService} from '@pirento/shared/server';
import {config} from '../config.js';
import {Trade} from '../models/Trade.js';
import {credits} from './credits.js';

export const debit = (trade) =>
  callService(config.walletUrl, '/internal/debit', {
    userId: trade.userId,
    amount: trade.amount,
    ref: `green-buy-${trade._id}`,
    note: `Bought ${credits(trade.units)} carbon credits · Pirento Green`,
  });

/** Pays every sell still owed to this person. A failure stays owed and is tried again on their next look. */
export async function payOwed(userId) {
  for (const t of await Trade.find({userId, status: 'owed'}).lean()) {
    try {
      await callService(config.walletUrl, '/internal/credit', {
        userId,
        amount: t.amount,
        ref: `green-sell-${t._id}`,
        note: `Sold ${credits(t.units)} carbon credits · Pirento Green`,
      });
      await Trade.updateOne({_id: t._id, status: 'owed'}, {$set: {status: 'done'}});
    } catch (err) {
      console.error('green sell still owed', String(t._id), err.message);
    }
  }
}
