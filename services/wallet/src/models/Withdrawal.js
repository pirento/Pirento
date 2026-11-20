// A request to take wallet money out to a UPI ID.
import mongoose from 'mongoose';

/**
 * The amount is debited when the request is made (so it cannot be spent twice);
 * a rejection credits it back.
 * requested → paid (finance sent it and noted the UTR) or rejected.
 */
export const WITHDRAWAL_STATUSES = ['requested', 'paid', 'rejected'];

const schema = new mongoose.Schema(
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
);
// One open request per person, enforced by the database so two quick clicks cannot both get through.
schema.index(
  {userId: 1},
  // Its own name, beside the plain userId index the field already has.
  {name: 'one_open_request', unique: true, partialFilterExpression: {status: 'requested'}},
);

export const Withdrawal = mongoose.model('Withdrawal', schema);
