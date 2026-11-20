// A discount code set up in admin.
import mongoose from 'mongoose';

/**
 * A discount code. `percent` takes value% off; `flat` takes value rupees off.
 * Optional limits: one product, a minimum order, a number of uses, an end date.
 */
export const Coupon = mongoose.model(
  'Coupon',
  new mongoose.Schema(
    {
      code: {type: String, required: true, unique: true, uppercase: true, trim: true},
      kind: {type: String, enum: ['percent', 'flat'], required: true},
      value: {type: Number, required: true, min: 1},
      product: String, // a product slug, or empty for every product
      minAmount: {type: Number, default: 0}, // rupees
      maxUses: {type: Number, default: 0}, // 0 = no limit
      uses: {type: Number, default: 0},
      expiresAt: Date,
      active: {type: Boolean, default: true},
      createdBy: String,
    },
    {timestamps: true},
  ),
);
