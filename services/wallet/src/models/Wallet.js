import mongoose from 'mongoose';

// One balance per account, in paise (whole numbers), so no amount is ever a float.
export const Wallet = mongoose.model(
  'Wallet',
  new mongoose.Schema({
    userId: {type: String, required: true, unique: true},
    balance: {type: Number, required: true, default: 0, min: 0},
    // The ref of every move already applied, so a retried debit or refund is a no-op.
    // shortcut: grows by one per order; move to a capped ledger collection past ~10k orders per user.
    refs: {type: [String], default: []},
  }),
);
