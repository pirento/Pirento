// Every time a business checks a Bharat ID or reads shared details: who, what and when. The holder sees their own.
import mongoose from 'mongoose';

export const AccessLog = mongoose.model(
  'AccessLog',
  new mongoose.Schema(
    {
      businessId: {type: String, required: true, index: true},
      businessName: String,
      mode: {type: String, enum: ['test', 'live'], required: true},
      bharatId: String,
      userId: {type: String, index: true}, // the holder, live only
      action: {type: String, required: true}, // verify, consent.request, consent.read, auth.request, auth.read
      fields: [String],
      method: String,
      ip: String,
    },
    {timestamps: {createdAt: true, updatedAt: false}},
  ),
);
