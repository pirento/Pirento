// The site settings a superadmin can change without a deploy (banner, paused checkouts). One document, _id 'site'.
import mongoose from 'mongoose';
import {cached, forgetOnWrite} from '@pirento/shared/server';

const schema = new mongoose.Schema({
  _id: {type: String, default: 'site'},
  banner: {
    _id: false,
    on: {type: Boolean, default: false},
    text: {type: String, default: '', maxlength: 160},
    link: {type: String, default: '', maxlength: 200}, // a path on this site, e.g. /legal
  },
  paused: {type: [String], default: []}, // product slugs whose checkout is closed for now
});
forgetOnWrite(schema, 'catalog:settings');
export const Settings = mongoose.model('Settings', schema);

// Every page shows the banner, so this is cached; saving the settings forgets it.
export const readSettings = () =>
  cached(
    'catalog:settings',
    60,
    async () => (await Settings.findById('site').lean()) ?? {banner: {on: false, text: '', link: ''}, paused: []},
  );
