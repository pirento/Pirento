// What a person asked Pirento AI to remember about them (their company, city, how they like answers), written
// and deleted by them. Off by default; personal data, removed when the account is deleted.
import mongoose from 'mongoose';

export const MEMORY_MAX = {notes: 10, chars: 200};

export const Memory = mongoose.model(
  'Memory',
  new mongoose.Schema(
    {
      userId: {type: String, required: true, unique: true},
      on: {type: Boolean, default: false},
      notes: {type: [String], default: []},
    },
    {timestamps: true},
  ),
);
