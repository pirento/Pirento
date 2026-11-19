import crypto from 'node:crypto';
import mongoose from 'mongoose';
import {z} from 'zod';
import {STAFF_TRANSITIONS, getService, validateIntake} from '@pirento/shared';
import {
  ApiError,
  asyncHandler,
  callService,
  createApp,
  env,
  finish,
  nextSeq,
  requireAuth,
  requireRole,
  STAFF,
  start,
  validate,
} from '@pirento/shared/server';
import {checkoutSignatureOk, createRazorpayOrder, razorpayConfig, webhookSignatureOk} from './razorpay.js';

const WALLET_URL = env('WALLET_URL', 'http://127.0.0.1:4002');
const CODE_PREFIX = {legal: 'LGL', black: 'BLK', green: 'GRN'};

const nextOrderNo = async () => (await nextSeq('order')) + 100000;

const Order = mongoose.model(
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
      amount: {type: Number, required: true, min: 1}, // paise, from the server catalog × quantity
      intake: {type: Object, default: {}},
      status: {type: String, required: true, default: 'pending_payment', index: true},
      timeline: [{_id: false, status: String, note: String, at: {type: Date, default: Date.now}}],
      payment: {
        method: {type: String, enum: ['wallet', 'razorpay']},
        razorpayOrderId: {type: String, index: true, sparse: true},
        razorpayPaymentId: String,
        refunded: Boolean,
      },
      code: {type: String, unique: true, sparse: true}, // public completion code, e.g. BLK-7F3A9C
    },
    {timestamps: true},
  ),
);

const app = createApp('orders');

/** Moves pending_payment → paid exactly once. Returns null if the order was not pending. */
const markPaid = (id, payment, note) =>
  Order.findOneAndUpdate(
    {_id: id, status: 'pending_payment'},
    {$set: {status: 'paid', payment}, $push: {timeline: {status: 'paid', note}}},
    {new: true},
  );

async function findMine(req) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(404, 'NOT_FOUND', 'Order not found');
  const order = await Order.findById(req.params.id);
  if (!order || (order.userId !== req.user.sub && !STAFF.includes(req.user.role))) {
    throw new ApiError(404, 'NOT_FOUND', 'Order not found');
  }
  return order;
}

// ── Public ────────────────────────────────────────────────────────────────

app.get('/config', (_req, res) => res.json({data: {razorpayKeyId: razorpayConfig()?.keyId ?? null}}));

app.get(
  '/verify/:code',
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({code: req.params.code.toUpperCase(), status: 'completed'});
    if (!order) throw new ApiError(404, 'NOT_FOUND', 'No completed work has this code');
    const done = order.timeline.findLast((t) => t.status === 'completed');
    // Only what proves the work exists; never the customer's details.
    res.json({data: {code: order.code, serviceName: order.serviceName, product: order.product, completedAt: done?.at}});
  }),
);

app.post(
  '/payments/razorpay/webhook',
  asyncHandler(async (req, res) => {
    const cfg = razorpayConfig();
    if (!cfg || !webhookSignatureOk(cfg.webhookSecret, req.rawBody, req.headers['x-razorpay-signature'])) {
      throw new ApiError(400, 'BAD_SIGNATURE', 'Invalid signature');
    }
    const payment = req.body.payload?.payment?.entity;
    if (req.body.event === 'payment.captured' && payment?.order_id) {
      const order = await Order.findOne({'payment.razorpayOrderId': payment.order_id});
      if (order && payment.amount === order.amount) {
        const paid = await markPaid(
          order._id,
          {method: 'razorpay', razorpayOrderId: payment.order_id, razorpayPaymentId: payment.id},
          'Paid with Razorpay',
        );
        // shortcut: money captured on an order that was cancelled meanwhile needs a manual Razorpay refund; automate with the refunds API.
        if (!paid && order.status === 'cancelled') console.warn(`Captured payment on cancelled order ${order.orderNo}`);
      }
    }
    res.json({data: {ok: true}});
  }),
);

// ── Customer ──────────────────────────────────────────────────────────────

app.use(requireAuth);

app.post(
  '/',
  validate(
    z.object({
      serviceSlug: z.string().max(80),
      quantity: z.number().int().min(1).default(1),
      intake: z.record(z.string(), z.string()).default({}),
    }),
  ),
  asyncHandler(async (req, res) => {
    const service = getService(req.body.serviceSlug);
    if (!service?.price) throw new ApiError(400, 'NOT_FOR_SALE', 'This service cannot be bought online yet');
    const {answers, error} = validateIntake(service.product, service.slug, req.body.intake);
    if (error) throw new ApiError(400, 'INVALID_INPUT', error);
    if (req.body.quantity > (service.maxQty ?? 1)) {
      throw new ApiError(400, 'INVALID_INPUT', `You can order at most ${service.maxQty ?? 1} at a time`);
    }
    const order = await Order.create({
      orderNo: await nextOrderNo(),
      userId: req.user.sub,
      email: req.user.email,
      product: service.product,
      serviceSlug: service.slug,
      serviceName: service.name,
      quantity: req.body.quantity,
      amount: service.price * 100 * req.body.quantity,
      intake: answers,
      timeline: [{status: 'pending_payment', note: 'Order placed'}],
    });
    res.status(201).json({data: order});
  }),
);

app.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json({data: await Order.find({userId: req.user.sub}).sort({createdAt: -1}).limit(100)});
  }),
);

app.get(
  '/:id',
  asyncHandler(async (req, res) => res.json({data: await findMine(req)})),
);

app.post(
  '/:id/pay/wallet',
  asyncHandler(async (req, res) => {
    const order = await findMine(req);
    if (order.status !== 'pending_payment') throw new ApiError(409, 'NOT_PAYABLE', 'This order is already settled');
    const ref = `order:${order._id}`;
    await callService(WALLET_URL, '/internal/debit', {
      userId: order.userId,
      amount: order.amount,
      ref,
      note: `Order #${order.orderNo} · ${order.serviceName}`.slice(0, 140),
    });
    const paid = await markPaid(order._id, {method: 'wallet'}, 'Paid from wallet');
    if (!paid) {
      // A parallel retry of this same wallet payment already marked it paid: the
      // debit was idempotent, so there is nothing to give back.
      const now = await Order.findById(order._id);
      if (now.payment?.method === 'wallet') return res.json({data: now});
      // Settled another way (or cancelled) while we were debiting: give the money back.
      await callService(WALLET_URL, '/internal/credit', {
        userId: order.userId,
        amount: order.amount,
        ref: `void:${ref}`,
        note: `Refund · order #${order.orderNo} was already settled`,
      });
      throw new ApiError(409, 'NOT_PAYABLE', 'This order was already settled. Your wallet was refunded.');
    }
    res.json({data: paid});
  }),
);

app.post(
  '/:id/pay/razorpay',
  asyncHandler(async (req, res) => {
    const cfg = razorpayConfig();
    if (!cfg) throw new ApiError(503, 'PAYMENTS_UNAVAILABLE', 'Card and UPI payments are not switched on yet');
    let order = await findMine(req);
    if (order.status !== 'pending_payment') throw new ApiError(409, 'NOT_PAYABLE', 'This order is already settled');
    if (!order.payment?.razorpayOrderId) {
      const rzp = await createRazorpayOrder(cfg, order.amount, `order-${order.orderNo}`);
      order = await Order.findByIdAndUpdate(order._id, {'payment.razorpayOrderId': rzp.id}, {new: true});
    }
    res.json({
      data: {
        keyId: cfg.keyId,
        razorpayOrderId: order.payment.razorpayOrderId,
        amount: order.amount,
        email: order.email,
      },
    });
  }),
);

app.post(
  '/:id/pay/razorpay/verify',
  validate(
    z.object({
      razorpay_order_id: z.string().max(60),
      razorpay_payment_id: z.string().max(60),
      razorpay_signature: z.string().max(128),
    }),
  ),
  asyncHandler(async (req, res) => {
    const cfg = razorpayConfig();
    const order = await findMine(req);
    if (
      !cfg ||
      order.payment?.razorpayOrderId !== req.body.razorpay_order_id ||
      !checkoutSignatureOk(cfg.keySecret, req.body)
    ) {
      throw new ApiError(400, 'BAD_SIGNATURE', 'We could not confirm this payment');
    }
    const paid = await markPaid(
      order._id,
      {
        method: 'razorpay',
        razorpayOrderId: req.body.razorpay_order_id,
        razorpayPaymentId: req.body.razorpay_payment_id,
      },
      'Paid with Razorpay',
    );
    res.json({data: paid ?? (await Order.findById(order._id))});
  }),
);

app.post(
  '/:id/cancel',
  asyncHandler(async (req, res) => {
    const order = await findMine(req);
    const cancelled = await Order.findOneAndUpdate(
      {_id: order._id, status: 'pending_payment'},
      {$set: {status: 'cancelled'}, $push: {timeline: {status: 'cancelled', note: 'Cancelled by you'}}},
      {new: true},
    );
    if (!cancelled) throw new ApiError(409, 'NOT_CANCELLABLE', 'Paid orders can only be cancelled by our team');
    res.json({data: cancelled});
  }),
);

// ── Staff ─────────────────────────────────────────────────────────────────

app.get(
  '/staff/queue',
  requireRole(...STAFF),
  asyncHandler(async (req, res) => {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const filter = status && status in STAFF_TRANSITIONS ? {status} : {status: {$in: ['paid', 'in_progress']}};
    res.json({data: await Order.find(filter).sort({createdAt: 1}).limit(200)});
  }),
);

app.patch(
  '/staff/:id',
  requireRole(...STAFF),
  validate(z.object({status: z.enum(['in_progress', 'completed', 'cancelled']), note: z.string().trim().max(300)})),
  asyncHandler(async (req, res) => {
    const order = await findMine(req);
    const {status, note} = req.body;
    // Re-sending "cancelled" retries a wallet refund that failed the first time.
    const retryRefund =
      status === 'cancelled' &&
      order.status === 'cancelled' &&
      order.payment?.method === 'wallet' &&
      !order.payment.refunded;
    if (!retryRefund && !STAFF_TRANSITIONS[order.status].includes(status)) {
      throw new ApiError(409, 'BAD_TRANSITION', `An order that is ${order.status} cannot become ${status}`);
    }
    const set = {status};
    if (status === 'completed' && CODE_PREFIX[order.product]) {
      set.code = `${CODE_PREFIX[order.product]}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    }
    // Conditional on the old status, so two staff clicks cannot both apply.
    let updated = retryRefund
      ? order
      : await Order.findOneAndUpdate(
          {_id: order._id, status: order.status},
          {$set: set, $push: {timeline: {status, note: note || undefined}}},
          {new: true},
        );
    if (!updated) throw new ApiError(409, 'CHANGED', 'Someone else just updated this order. Reload and try again.');

    if (status === 'cancelled' && order.payment?.method === 'wallet' && !order.payment.refunded) {
      await callService(WALLET_URL, '/internal/credit', {
        userId: order.userId,
        amount: order.amount,
        ref: `refund:${order._id}`,
        note: `Refund · order #${order.orderNo}`,
      });
      updated = await Order.findByIdAndUpdate(
        order._id,
        {$set: {'payment.refunded': true}, $push: {timeline: {status: 'cancelled', note: 'Refunded to your wallet'}}},
        {new: true},
      );
    }
    // shortcut: Razorpay-paid cancellations are refunded by hand from the Razorpay dashboard; automate with the refunds API.
    res.json({data: updated});
  }),
);

start(finish(app), {
  name: 'orders',
  port: Number(env('PORT', 4004)),
  mongoUri: env('MONGO_URI', 'mongodb://127.0.0.1:27017/pirento_orders'),
});
