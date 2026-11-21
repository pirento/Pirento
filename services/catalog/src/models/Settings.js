// The site settings a superadmin can change without a deploy (banner, paused checkouts, partner commission). One document, _id 'site'.
import mongoose from 'mongoose';

export const Settings = mongoose.model(
  'Settings',
  new mongoose.Schema({
    _id: {type: String, default: 'site'},
    banner: {
      _id: false,
      on: {type: Boolean, default: false},
      text: {type: String, default: '', maxlength: 160},
      link: {type: String, default: '', maxlength: 200}, // a path on this site, e.g. /legal
    },
    paused: {type: [String], default: []}, // product slugs whose checkout is closed for now
    commissionPct: {type: Number, default: 0, min: 0, max: 50}, // Pirento One partners' share of a completed order
  }),
);

export const readSettings = async () =>
  (await Settings.findById('site').lean()) ?? {banner: {on: false, text: '', link: ''}, paused: [], commissionPct: 0};
