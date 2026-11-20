// An admin's change to one service's price, kept apart from the base catalogue.
import mongoose from 'mongoose';

/**
 * A change to one service's catalogue price, made in admin. The base price
 * stays in packages/shared; this row wins over it. `price: null` with
 * `offSale: true` takes the service off sale without deleting it.
 */
export const PriceOverride = mongoose.model(
  'PriceOverride',
  new mongoose.Schema(
    {
      slug: {type: String, required: true, unique: true},
      price: {type: Number, min: 1}, // rupees
      offSale: {type: Boolean, default: false},
      updatedBy: String,
    },
    {timestamps: true},
  ),
);

/** slug → {price, offSale}, for merging into the shared catalogue. */
export async function overrideMap() {
  const rows = await PriceOverride.find({}, {slug: 1, price: 1, offSale: 1}).lean();
  return Object.fromEntries(rows.map((r) => [r.slug, {price: r.price ?? null, offSale: r.offSale}]));
}
