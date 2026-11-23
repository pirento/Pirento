// Every price the team set, with who and when: the market's chart is this history.
import mongoose from 'mongoose';

export const PricePoint = mongoose.model(
  'PricePoint',
  new mongoose.Schema({
    price: {type: Number, required: true, min: 1}, // paise per credit
    by: String, // the staffer's email
    at: {type: Date, default: Date.now, index: true},
  }),
);
