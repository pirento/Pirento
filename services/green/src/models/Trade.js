// One move of credits: a buy or sell for wallet money, or a claim of credits grown by planted trees.
import mongoose from 'mongoose';

/**
 * pending: a buy whose wallet debit is under way · done · failed: the debit was refused, nothing moved ·
 * owed: a sell whose credits left the holding but whose wallet credit has not landed yet (paid again on the next look).
 */
export const TRADE_STATUSES = ['pending', 'done', 'failed', 'owed'];

export const Trade = mongoose.model(
  'Trade',
  new mongoose.Schema(
    {
      userId: {type: String, required: true, index: true},
      side: {type: String, enum: ['buy', 'sell', 'claim'], required: true},
      units: {type: Number, required: true, min: 1},
      price: {type: Number, default: 0}, // paise per credit at the time; 0 for a claim
      amount: {type: Number, default: 0}, // paise moved
      status: {type: String, enum: TRADE_STATUSES, required: true, index: true},
      orderNo: Number, // the sponsorship a claim grew from
    },
    {timestamps: true},
  ),
);
