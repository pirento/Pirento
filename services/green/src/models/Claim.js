// How far each planted sponsorship's credits have been claimed; growth counts from lastClaimAt.
import mongoose from 'mongoose';

export const Claim = mongoose.model(
  'Claim',
  new mongoose.Schema({
    userId: {type: String, required: true, index: true},
    orderId: {type: String, required: true, unique: true},
    lastClaimAt: {type: Date, required: true},
    claimedUnits: {type: Number, default: 0},
  }),
);
