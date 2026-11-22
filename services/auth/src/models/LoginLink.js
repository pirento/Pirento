// A one-time sign-in link sent by email and SMS (e.g. to carry on a Bharat ID application started by staff).
// Only the token's SHA-256 is stored; it works once, and MongoDB's TTL index removes it once it expires.
import mongoose from 'mongoose';

export const LoginLink = mongoose.model(
  'LoginLink',
  new mongoose.Schema(
    {
      userId: {type: String, required: true, index: true},
      tokenHash: {type: String, required: true, unique: true},
      usedAt: Date,
      expiresAt: {type: Date, required: true, index: {expires: 0}},
    },
    {timestamps: true},
  ),
);
