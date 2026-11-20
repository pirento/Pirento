import mongoose from 'mongoose';

/**
 * A request to take wallet money out to a UPI ID. The amount is debited when
 * the request is made (so it cannot be spent twice); a rejection credits it back.
 * requested → paid (finance sent it and noted the UTR) or rejected.
 */
export const WITHDRAWAL_STATUSES = ['requested', 'paid', 'rejected'];

export const Withdrawal = mongoose.model(
  'Withdrawal',
  new mongoose.Schema(
    {
      userId: {type: String, required: true, index: true},
      email: {type: String, required: true},
      amount: {type: Number, required: true, min: 1}, // paise
      upi: {type: String, required: true, maxlength: 60},
      status: {type: String, enum: WITHDRAWAL_STATUSES, default: 'requested', index: true},
      utr: {type: String, maxlength: 40}, // the bank's reference once paid
      reason: {type: String, maxlength: 200}, // why it was rejected
      decidedBy: String,
      decidedAt: Date,
    },
    {timestamps: true},
  ),
);
