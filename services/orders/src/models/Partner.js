// A Pirento One partner and their code.
import mongoose from 'mongoose';

// A Pirento One partner and the code they share. Orders placed after opening
// their link carry this code in `Order.ref`.
// Commission on their completed orders goes to their wallet at their plan's rate (lib/commission.js).
export const Partner = mongoose.model(
  'Partner',
  new mongoose.Schema(
    {
      userId: {type: String, required: true, unique: true},
      code: {type: String, required: true, unique: true},
      // A paid plan bought from the wallet, with its rate fixed at purchase. None, or past `until`, means the free plan.
      plan: {_id: false, id: String, name: String, commissionPct: Number, until: Date},
      lastPurchase: String, // the wallet ref of the last purchase, so a retried purchase applies once
    },
    {timestamps: true},
  ),
);
