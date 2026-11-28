// An order: one service, its price, its answers and its timeline.
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
      package: {_id: false, id: String, name: String}, // the package bought, as named when ordered
      quantity: {type: Number, default: 1, min: 1},
      invoiceNo: String, // set once its invoice is issued (lib/invoices.js)
      invoiceId: String,
      amount: {type: Number, required: true, min: 1}, // paise: catalog price × quantity
      intake: {type: Object, default: {}}, // answers to the checkout questions
      asked: {type: [{_id: false, id: String, label: String}], default: undefined}, // those questions, as asked
      // Asked once the order is paid (set per service in admin), and the customer's answers.
      afterQuestions: {type: Array, default: undefined},
      details: {type: Object},
      detailsAt: Date,
      status: {type: String, required: true, default: 'pending_payment', index: true},
      timeline: [{_id: false, status: String, note: String, at: {type: Date, default: Date.now}}],
      // The conversation on this order between the customer and the team; status changes stay on the timeline.
      messages: [
        {
          _id: false,
          from: {type: String, enum: ['customer', 'team'], required: true},
          body: {type: String, required: true, maxlength: 1000},
          by: String, // the staffer's email on team messages
          at: {type: Date, default: Date.now},
        },
      ],
      payment: {
        method: {type: String, enum: ['wallet', 'razorpay']},
        razorpayOrderId: {type: String, index: true, sparse: true},
        razorpayPaymentId: String,
        refunded: Boolean,
        refundId: String, // the Razorpay refund of a cancelled card/UPI order
        refundTries: Number, // Razorpay refunds that failed; each retry needs a fresh idempotency key
        // Razorpay payments that arrived after the order was already settled, and those of them refunded.
        extra: [String],
        extraRefunded: [String],
      },
      code: {type: String, unique: true, sparse: true}, // public completion code
      ref: {type: String, index: true}, // Pirento One partner code that brought this order
      // The partner's share, fixed when the order completes; `paid` once it reached their wallet.
      commission: {_id: false, userId: String, pct: Number, amount: Number, paid: Boolean},
      coupon: String, // code used at checkout
      discount: {type: Number, default: 0}, // paise taken off by the coupon; amount is after it
      couponCounted: Boolean, // the coupon's use was counted for this order (once, whatever the retries)
      // Green and Giftox: what the team recorded on delivery (FULFILMENT in the shared order rules), with who and when.
      fulfilment: {type: Object},
      assignee: {_id: false, id: String, email: String}, // the staffer working it
      bookedBy: {_id: false, id: String, email: String}, // a staffer who placed it for the customer
    },
    {timestamps: true},
  ),
);
