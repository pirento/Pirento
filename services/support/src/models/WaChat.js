// One WhatsApp conversation, per number: whose account it is (if any), whether the bot or a person answers, when
// the person last wrote (Meta allows free text only in the 24 hours after), and the bot's daily AI count.
import mongoose from 'mongoose';

export const WaChat = mongoose.model(
  'WaChat',
  new mongoose.Schema(
    {
      wa: {type: String, required: true, unique: true}, // 91XXXXXXXXXX
      name: {type: String, maxlength: 80}, // their WhatsApp profile name
      userId: {type: String, index: true},
      email: String,
      mode: {type: String, enum: ['bot', 'staff'], default: 'bot'},
      assignee: {id: String, email: String},
      ticketId: String, // the ticket a hand-over opened
      ticketNo: Number,
      lastInboundAt: Date,
      lastAt: Date,
      lastText: {type: String, maxlength: 200},
      unread: {type: Number, default: 0},
      aiDay: String, // YYYY-MM-DD, India time
      aiCount: {type: Number, default: 0},
    },
    {timestamps: true},
  ).index({mode: 1, lastAt: -1}),
);
