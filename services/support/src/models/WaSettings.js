// WhatsApp settings from admin → WhatsApp: the bot on or off, Pirento AI in it on or off, the greeting, and how many AI
// answers one number gets a day.
import mongoose from 'mongoose';

export const WaSettings = mongoose.model(
  'WaSettings',
  new mongoose.Schema(
    {
      _id: {type: String, default: 'main'},
      bot: {type: Boolean, default: true},
      ai: {type: Boolean, default: true},
      greeting: {type: String, maxlength: 500, default: ''},
      dailyAi: {type: Number, default: 30, min: 0, max: 500},
      updatedBy: String,
    },
    {timestamps: true},
  ),
);
