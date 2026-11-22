// A Pirento One plan a superadmin makes in admin: free (price 0, no end) or paid (bought from the wallet for some months).
import mongoose from 'mongoose';

export const PartnerPlan = mongoose.model(
  'PartnerPlan',
  new mongoose.Schema(
    {
      name: {type: String, required: true, maxlength: 40},
      price: {type: Number, required: true, min: 0}, // paise; 0 is the free plan
      months: {type: Number, default: 0}, // how long a purchase lasts; 0 on the free plan
      commissionPct: {type: Number, required: true, min: 0, max: 50},
      features: {type: [String], default: []},
      recommended: {type: Boolean, default: false},
      active: {type: Boolean, default: true}, // retired plans stay for the record but are not offered
      sort: {type: Number, default: 0},
    },
    {timestamps: true},
  ),
);
