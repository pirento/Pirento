// The admin's layer over the catalogue, one row per service: price, off sale, questions, or a whole new service.
import mongoose from 'mongoose';
import {cached, forgetOnWrite} from '@pirento/shared/server';

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

// One package a service sells; price in rupees.
const pack = new mongoose.Schema(
  {
    id: String,
    name: String,
    price: Number,
    strike: Number, // an earlier price shown struck through, if any
    deliveryTime: String,
    includes: {type: [String], default: []},
    recommended: Boolean,
  },
  {_id: false},
);

/**
 * The base catalogue stays in packages/shared; this row wins over it (applyEdit there). `custom` holds a service
 * made in admin. Questions left unset mean the defaults. Kept in the collection the price changes always used.
 */
const schema = new mongoose.Schema(
  {
    slug: {type: String, required: true, unique: true},
    price: {type: Number, min: 1}, // rupees
    offSale: {type: Boolean, default: false},
    questions: {type: [question], default: undefined}, // before payment
    afterQuestions: {type: [question], default: undefined}, // after payment
    custom: {type: custom, default: undefined},
    packages: {type: [pack], default: undefined}, // replaces the catalogue's packages
    // The service page's sections (servicePage in packages/shared); not in the price map, read per page.
    page: {type: Object, default: undefined},
    updatedBy: String,
  },
  {timestamps: true},
);
forgetOnWrite(schema, 'catalog:edits');
export const ServiceEdit = mongoose.model('ServiceEdit', schema, 'priceoverrides');

/** slug → the admin's edits, for applyEdit / editedService in packages/shared. */
// Read on every page load (prices) and every order, so it is cached; any edit forgets it.
export const editMap = () => cached('catalog:edits', 60, loadEdits);
async function loadEdits() {
  const rows = await ServiceEdit.find({}, {_id: 0, createdAt: 0, updatedAt: 0, updatedBy: 0, __v: 0, page: 0}).lean();
  return Object.fromEntries(rows.map(({slug, ...edit}) => [slug, edit]));
}

/** A service's page sections as admin wrote them, or null. Cached per slug; any edit forgets every page. */
export const pageEdit = (slug) =>
  cached(`catalog:page:${slug}`, 60, async () => (await ServiceEdit.findOne({slug}, {page: 1}).lean())?.page ?? null);
