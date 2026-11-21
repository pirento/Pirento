// The admin's layer over the catalogue, one row per service: price, off sale, questions, or a whole new service.
import mongoose from 'mongoose';

const question = new mongoose.Schema(
  {
    id: String,
    label: String,
    help: String,
    placeholder: String,
    options: {type: [String], default: undefined},
    required: Boolean,
  },
  {_id: false},
);

// A service made in admin. `price` is in rupees: the price it goes back to on "Reset".
const custom = new mongoose.Schema(
  {
    product: String,
    name: String,
    category: String,
    description: String,
    deliveryTime: String,
    model: {type: String, enum: ['fixed', 'consult']},
    price: Number,
    includes: {type: [String], default: undefined},
  },
  {_id: false},
);

/**
 * The base catalogue stays in packages/shared; this row wins over it (applyEdit there). `custom` holds a service
 * made in admin. Questions left unset mean the defaults. Kept in the collection the price changes always used.
 */
export const ServiceEdit = mongoose.model(
  'ServiceEdit',
  new mongoose.Schema(
    {
      slug: {type: String, required: true, unique: true},
      price: {type: Number, min: 1}, // rupees
      offSale: {type: Boolean, default: false},
      questions: {type: [question], default: undefined}, // before payment
      afterQuestions: {type: [question], default: undefined}, // after payment
      custom: {type: custom, default: undefined},
      updatedBy: String,
    },
    {timestamps: true},
  ),
  'priceoverrides',
);

/** slug → the admin's edits, for applyEdit / editedService in packages/shared. */
export async function editMap() {
  const rows = await ServiceEdit.find({}, {_id: 0, createdAt: 0, updatedAt: 0, updatedBy: 0, __v: 0}).lean();
  return Object.fromEntries(rows.map(({slug, ...edit}) => [slug, edit]));
}
