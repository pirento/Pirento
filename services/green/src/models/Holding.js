// A person's credits: units of 0.01 credit, and what they paid for the ones they hold.
import mongoose from 'mongoose';

export const Holding = mongoose.model(
  'Holding',
  new mongoose.Schema(
    {
      userId: {type: String, required: true, unique: true},
      units: {type: Number, default: 0, min: 0},
      cost: {type: Number, default: 0, min: 0}, // paise paid for the units held; credits grown from trees cost nothing
    },
    {timestamps: true},
  ),
);
