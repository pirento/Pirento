// Money added by card or UPI through Razorpay: saved when checkout opens, credited once when the payment is confirmed.
import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    userId: {type: String, required: true, index: true},
    amount: {type: Number, required: true}, // paise, fixed by the server when the Razorpay order is made
    razorpayOrderId: {type: String, required: true, unique: true},
    paymentId: String,
    paidAt: Date,
  },
  {timestamps: true},
);

export const Topup = mongoose.model('Topup', schema);
