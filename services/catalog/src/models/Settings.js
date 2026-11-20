import mongoose from 'mongoose';

// The site settings a superadmin can change without a deploy. One document, _id 'site'.
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
  }),
);

export const readSettings = async () =>
  (await Settings.findById('site').lean()) ?? {banner: {on: false, text: '', link: ''}, paused: []};
