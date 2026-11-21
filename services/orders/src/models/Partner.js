// A Pirento One partner and their code.
import mongoose from 'mongoose';

// A Pirento One partner and the code they share. Orders placed after opening
// their link carry this code in `Order.ref`.
// Commission on their completed orders goes to their wallet (lib/commission.js).
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
