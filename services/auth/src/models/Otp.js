import mongoose from 'mongoose';

// A pending sign-in code. Only its hash is stored; MongoDB's TTL index removes
// it once expiresAt passes, and a successful sign-in deletes it at once.
export const Otp = mongoose.model(
  'Otp',
  new mongoose.Schema(
    {
      email: {type: String, required: true, index: true},
      codeHash: {type: String, required: true},
      attempts: {type: Number, default: 0},
      expiresAt: {type: Date, required: true, index: {expires: 0}},
    },
    {timestamps: true},
  ),
);
