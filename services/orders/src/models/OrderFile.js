// A document attached to an order: sent by the customer (their papers) or by the team (the finished work).
import mongoose from 'mongoose';

export const OrderFile = mongoose.model(
  'OrderFile',
  new mongoose.Schema(
    {
      orderId: {type: String, required: true, index: true},
      // The order's owner, so account deletion can find every file and the customer's list needs one query.
      userId: {type: String, required: true, index: true},
      from: {type: String, enum: ['customer', 'team'], required: true},
      by: String, // the staffer's email on team files
      name: {type: String, required: true, maxlength: 200},
      type: {type: String, maxlength: 100},
      size: {type: Number, required: true},
      // AES-256-GCM, see shared/server/crypto.js.
      iv: Buffer,
      tag: Buffer,
      data: Buffer,
    },
    {timestamps: true},
  ),
);

/** Everything but the encrypted bytes, for lists. */
export const WITHOUT_BYTES = {iv: 0, tag: 0, data: 0};
