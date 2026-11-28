// One WhatsApp message in a conversation: from the person, the bot or a staff member, with WhatsApp's id (so a
// webhook sent twice is stored once) and its delivery status.
import mongoose from 'mongoose';

export const WaMessage = mongoose.model(
  'WaMessage',
  new mongoose.Schema(
    {
      chatId: {type: String, required: true, index: true},
      dir: {type: String, enum: ['in', 'out'], required: true},
      from: {type: String, enum: ['customer', 'bot', 'staff']},
      by: String, // the staff member's email
      text: {type: String, maxlength: 4096},
      waMessageId: {type: String, unique: true, sparse: true},
      status: {type: String, default: 'sent'}, // sent, delivered, read, failed
      error: String,
    },
    {timestamps: true},
  ),
);
