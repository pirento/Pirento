// Pirento AI's settings a superadmin changes in admin: whether it answers at all, and the free daily allowance.
import mongoose from 'mongoose';
import {cached, forgetOnWrite} from '@pirento/shared/server';

export const FREE_DAILY_DEFAULT = 30;

const schema = new mongoose.Schema(
  {
    _id: {type: String, default: 'ai'},
    on: {type: Boolean, default: true}, // off: chats answer "paused" even with a key
    freeDailyLimit: {type: Number, default: FREE_DAILY_DEFAULT, min: 0, max: 1000},
    webSearch: {type: Boolean, default: true}, // current public facts from the web, a few searches per answer
  },
  {timestamps: true},
);
forgetOnWrite(schema, 'ai:settings');
export const Settings = mongoose.model('Settings', schema);

/** Read on every message, so cached; saving forgets it. */
export const readSettings = () =>
  cached(
    'ai:settings',
    60,
    async () =>
      (await Settings.findById('ai').lean()) ?? {on: true, freeDailyLimit: FREE_DAILY_DEFAULT, webSearch: true},
  );
