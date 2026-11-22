// One check that a person is a Bharat ID's holder, asked by a business and done on Pirento's own page.
import mongoose from 'mongoose';

export const AuthSession = mongoose.model(
  'AuthSession',
  new mongoose.Schema(
    {
      businessId: {type: String, required: true, index: true},
      businessName: {type: String, required: true},
      mode: {type: String, enum: ['test', 'live'], required: true},
      bharatId: {type: String, required: true},
      userId: String, // the holder, live only
      method: {type: String, required: true},
      level: Number,
      status: {type: String, enum: ['pending', 'passed', 'failed', 'expired'], default: 'pending'},
      tokenHash: {type: String, required: true}, // the link's secret; only its SHA-256 is kept
      returnUrl: {type: String, required: true},
      reference: String,
      attempts: {type: Number, default: 0},
      provider: {_id: false, name: String, requestId: String}, // Aadhaar OTP and face checks
      expiresAt: {type: Date, required: true},
      passedAt: Date,
    },
    {timestamps: true},
  ),
);
