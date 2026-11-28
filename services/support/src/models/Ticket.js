// A support ticket and its conversation.
import mongoose from 'mongoose';

/**
 * A support request and its conversation.
 * open: waiting on our team · answered: waiting on the customer · closed
 */
export const TICKET_STATUSES = ['open', 'answered', 'closed'];
export const PRIORITIES = ['low', 'medium', 'high'];

export const Ticket = mongoose.model(
  'Ticket',
  new mongoose.Schema(
    {
      ticketNo: {type: Number, required: true, unique: true}, // 8 digits, from 10000001
      userId: {type: String, required: true, index: true},
      email: {type: String, required: true},
      subject: {type: String, required: true, maxlength: 120},
      via: String, // 'ai' when Pirento AI opened it at the customer's request, 'whatsapp' from a WhatsApp chat
      // Pirento AI's sorting of a new ticket; it can raise the priority, never lower what the customer chose.
      triage: {_id: false, priority: String, product: String, category: String},
      orderNo: Number,
      // Which product it came from (its slug), or none for the account and wallet: one support desk for all.
      product: {type: String, index: true},
      // Set by the customer (quick topics suggest one); the team's queue puts high first.
      priority: {type: String, enum: PRIORITIES, default: 'medium'},
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
