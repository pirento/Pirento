// The ledger: one row per money movement, with the balance it left behind.
import mongoose from 'mongoose';

export const Transaction = mongoose.model(
  'Transaction',
  new mongoose.Schema(
    {
      userId: {type: String, required: true, index: true},
      type: {type: String, enum: ['credit', 'debit'], required: true},
      amount: {type: Number, required: true, min: 1},
      balanceAfter: {type: Number, required: true},
      note: {type: String, maxlength: 140},
      ref: {type: String, unique: true, sparse: true},
    },
    {timestamps: true},
  ),
);
