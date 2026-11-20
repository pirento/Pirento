import mongoose from 'mongoose';

/**
 * One purchase of one service. The price is copied from the server catalog at
 * the moment of ordering, so a later price change never alters an old order.
 * Life cycle: pending_payment → paid → in_progress → completed (or cancelled).
 */
export const Order = mongoose.model(
  'Order',
  new mongoose.Schema(
    {
      orderNo: {type: Number, unique: true, required: true},
      userId: {type: String, required: true, index: true},
      email: {type: String, required: true},
      product: {type: String, required: true},
      serviceSlug: {type: String, required: true},
      serviceName: {type: String, required: true},
      quantity: {type: Number, default: 1, min: 1},
      amount: {type: Number, required: true, min: 1}, // paise: catalog price × quantity
      intake: {type: Object, default: {}}, // answers to the checkout questions
      status: {type: String, required: true, default: 'pending_payment', index: true},
      timeline: [{_id: false, status: String, note: String, at: {type: Date, default: Date.now}}],
      payment: {
        method: {type: String, enum: ['wallet', 'razorpay']},
        razorpayOrderId: {type: String, index: true, sparse: true},
        razorpayPaymentId: String,
        refunded: Boolean,
      },
      code: {type: String, unique: true, sparse: true}, // public completion code
      ref: {type: String, index: true}, // Pirento One partner code that brought this order
      coupon: String, // code used at checkout
      discount: {type: Number, default: 0}, // paise taken off by the coupon; amount is after it
      assignee: {_id: false, id: String, email: String}, // the staffer working it
    },
    {timestamps: true},
  ),
);
