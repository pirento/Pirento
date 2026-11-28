// Shipping settings from admin → Shipments → Settings: whether paid orders ship by themselves, the pickup address,
// and for each shippable service (listed from the catalogue, never added by hand) its parcel: weight, size, pieces.
import mongoose from 'mongoose';

const address = {
  name: {type: String, maxlength: 80},
  address: {type: String, maxlength: 300},
  pincode: String,
  mobile: String,
};

export const ShipSettings = mongoose.model(
  'ShipSettings',
  new mongoose.Schema(
    {
      _id: {type: String, default: 'main'}, // one row
      auto: {type: Boolean, default: true}, // a paid order makes and books its parcel
      shipper: address, // overrides the BLUEDART_SHIPPER_* defaults when filled
      updatedBy: String,
    },
    {timestamps: true},
  ),
);

export const ShipProduct = mongoose.model(
  'ShipProduct',
  new mongoose.Schema(
    {
      slug: {type: String, required: true, unique: true},
      autoShip: {type: Boolean, default: true},
      weightKg: {type: Number, min: 0.05, max: 50}, // one unit; a quantity multiplies it
      lengthCm: {type: Number, min: 1, max: 200},
      breadthCm: {type: Number, min: 1, max: 200},
      heightCm: {type: Number, min: 1, max: 200},
      updatedBy: String,
    },
    {timestamps: true},
  ),
);

/** A service's parcel when admin has not set one: half a kilo in a 30 × 20 × 10 cm box. */
export const DEFAULT_PARCEL = {autoShip: true, weightKg: 0.5, lengthCm: 30, breadthCm: 20, heightCm: 10};
