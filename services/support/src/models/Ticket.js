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
      status: {type: String, enum: TICKET_STATUSES, default: 'open', index: true},
      messages: [
        {
          _id: false,
          from: {type: String, enum: ['customer', 'staff']},
          body: String,
          at: {type: Date, default: Date.now},
        },
      ],
    },
    {timestamps: true},
  ),
);
