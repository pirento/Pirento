// A paid Pirento AI plan a superadmin makes: more messages a day for some months, bought from the wallet.
import mongoose from 'mongoose';

export const Plan = mongoose.model(
  'Plan',
  new mongoose.Schema(
    {
      name: {type: String, required: true, maxlength: 40},
      price: {type: Number, required: true, min: 100}, // paise
      dailyLimit: {type: Number, required: true, min: 1, max: 1000},
      months: {type: Number, required: true, min: 1, max: 24},
      active: {type: Boolean, default: true},
      createdBy: String,
    },
    {timestamps: true},
  ),
);
