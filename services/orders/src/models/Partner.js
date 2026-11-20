import mongoose from 'mongoose';

// A Pirento One partner and the code they share. Orders placed after opening
// their link carry this code in `Order.ref`.
// shortcut: tracking only; commission payout is not built, so no money moves for partners.
export const Partner = mongoose.model(
  'Partner',
  new mongoose.Schema(
    {
      userId: {type: String, required: true, unique: true},
      code: {type: String, required: true, unique: true},
    },
    {timestamps: true},
  ),
);
