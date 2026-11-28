// Every action on a vault, in order: who (owner, nominee, staff or the system), what, on which item, whether it was
// confirmed with the Bharat ID PIN, and a hash linking it to the one before, so a changed or removed entry shows.
import mongoose from 'mongoose';

export const VaultLog = mongoose.model(
  'VaultLog',
  new mongoose.Schema({
    userId: {type: String, required: true},
    at: {type: Date, required: true},
    by: {type: String, enum: ['owner', 'nominee', 'staff', 'system'], required: true},
    action: {type: String, required: true, maxlength: 40},
    target: {type: String, maxlength: 120},
    pin: {type: Boolean, default: false},
    prev: String,
    hash: {type: String, required: true},
  }).index({userId: 1, at: 1}),
);
