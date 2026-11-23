// The one carbon market: the price the Pirento Green team sets, whether it is open, and each drive's growth rate.
import mongoose from 'mongoose';

export const Market = mongoose.model(
  'Market',
  new mongoose.Schema(
    {
      _id: {type: String, default: 'market'},
      price: {type: Number, min: 1}, // paise per credit; no price, no trading
      open: {type: Boolean, default: false},
      // Credits one planted tree grows in a year, per Green drive (its catalogue slug). No rate, no growth.
      rates: {type: Map, of: Number, default: {}},
    },
    {timestamps: true},
  ),
);

/** The market, made empty and closed the first time it is read. */
export const market = () =>
  Market.findOneAndUpdate({_id: 'market'}, {$setOnInsert: {open: false}}, {upsert: true, new: true}).lean();
