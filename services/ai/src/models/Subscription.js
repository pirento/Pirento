// The plan a person bought, copied at purchase so a later price or limit edit never changes what they paid for.
import mongoose from 'mongoose';

export const Subscription = mongoose.model(
  'Subscription',
  new mongoose.Schema(
    {
      userId: {type: String, required: true, unique: true},
      planId: String,
      name: String,
      dailyLimit: Number,
      until: Date,
      lastPurchase: String, // the wallet ref of the latest purchase: a retry applies once
      autoRenew: {type: Boolean, default: false}, // the person's choice: buy the same plan again from the wallet when it ends
    },
    {timestamps: true},
  ),
);
