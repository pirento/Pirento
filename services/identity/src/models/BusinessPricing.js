// What each live Bharat ID for Business call costs, in paise, set by a superadmin. 0 is free. One document.
import mongoose from 'mongoose';

export const PRICED = ['verify', 'consent', 'pin_dob', 'otp', 'aadhaar_otp', 'face'];

export const BusinessPricing = mongoose.model(
  'BusinessPricing',
  new mongoose.Schema({
    _id: {type: String, default: 'prices'},
    prices: {type: Object, default: {}}, // {verify: 200, otp: 500, …}
  }),
);

export const readPrices = async () => ({
  ...Object.fromEntries(PRICED.map((k) => [k, 0])),
  ...((await BusinessPricing.findById('prices').lean())?.prices ?? {}),
});
