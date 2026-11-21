// A request to take wallet money out to a UPI ID.
import mongoose from 'mongoose';

/**
 * The amount is debited when the request is made (so it cannot be spent twice);
 * a rejection credits it back.
 * requested → paid (finance sent it by hand and noted the UTR) or rejected, or
 * requested → processing (sent through RazorpayX) → paid, or rejected when the payout fails or reverses.
 */
export const WITHDRAWAL_STATUSES = ['requested', 'processing', 'paid', 'rejected'];

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
    // Set while the request is open (requested or processing); unset once paid or rejected.
    open: {type: Boolean, default: true},
    // The RazorpayX payout, when sent through the API.
    payout: {_id: false, id: String, status: String, error: String},
  },
  {timestamps: true},
);
// One open request per person, enforced by the database so two quick clicks cannot both get through.
schema.index(
  {userId: 1},
  // Its own name, beside the plain userId index the field already has. Covers requested and processing.
  {name: 'one_open_withdrawal', unique: true, partialFilterExpression: {open: true}},
);
schema.index({'payout.id': 1}, {sparse: true});

export const Withdrawal = mongoose.model('Withdrawal', schema);
