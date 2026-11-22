// A business asking a Bharat ID holder to share some details; the holder allows or declines it in their dashboard.
import mongoose from 'mongoose';

export const Consent = mongoose.model(
  'Consent',
  new mongoose.Schema(
    {
      businessId: {type: String, required: true, index: true},
      businessName: {type: String, required: true}, // what the holder sees
      mode: {type: String, enum: ['test', 'live'], required: true},
      bharatId: {type: String, required: true},
      userId: {type: String, index: true}, // the holder, for live requests
      purpose: {type: String, required: true, maxlength: 200},
      fields: {type: [String], required: true},
      reference: {type: String, maxlength: 80}, // the business's own id for this check
      status: {type: String, enum: ['pending', 'approved', 'declined', 'revoked'], default: 'pending'},
      decidedAt: Date,
    },
    {timestamps: true},
  ),
);
