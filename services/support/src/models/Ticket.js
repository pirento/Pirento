// A support ticket and its conversation.
import mongoose from 'mongoose';

/**
 * A support request and its conversation.
 * open: waiting on our team · answered: waiting on the customer · closed
 */
export const TICKET_STATUSES = ['open', 'answered', 'closed'];

export const Ticket = mongoose.model(
  'Ticket',
  new mongoose.Schema(
    {
      ticketNo: {type: Number, required: true, unique: true}, // 8 digits, from 10000001
      userId: {type: String, required: true, index: true},
      email: {type: String, required: true},
      subject: {type: String, required: true, maxlength: 120},
      orderNo: Number,
      // Which product it came from (its slug), or none for the account and wallet: one support desk for all.
      product: {type: String, index: true},
      status: {type: String, enum: TICKET_STATUSES, default: 'open', index: true},
      messages: [
        {
          _id: false,
          from: {type: String, enum: ['customer', 'staff']},
          body: String,
          at: {type: Date, default: Date.now},
        },
      ],
      // Team-only: who is on it, and notes the customer never sees.
      assignee: {_id: false, id: String, email: String},
      notes: [{_id: false, by: String, body: String, at: {type: Date, default: Date.now}}],
    },
    {timestamps: true},
  ),
);
