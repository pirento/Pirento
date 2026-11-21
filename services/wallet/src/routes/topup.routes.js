// Adding money to the wallet by card or UPI (Razorpay), plus test money where that is allowed.
import {Router} from 'express';
import mongoose from 'mongoose';
import {z} from 'zod';
import {
  ApiError,
  checkoutSignatureOk,
  createRazorpayOrder,
  razorpayConfig,
  requireAuth,
  validate,
  webhookSignatureOk,
} from '@pirento/shared/server';
import {config} from '../config.js';
import {Topup} from '../models/Topup.js';
import {move} from '../lib/move.js';
import {toPaise} from '../lib/money.js';

export const topupRoutes = Router();

const MIN = 100; // paise; Razorpay takes nothing under ₹1

/**
 * Credits a confirmed top-up. The wallet move carries the Razorpay order as its ref, so the browser's
 * callback and the webhook can both arrive (in any order, any number of times) and the money lands once.
 */
async function credit(topup, paymentId) {
  const wallet = await move(
    topup.userId,
    'credit',
    topup.amount,
    'Added by card or UPI',
    `topup-${topup.razorpayOrderId}`,
  );
  await Topup.updateOne({_id: topup._id, paidAt: {$exists: false}}, {$set: {paymentId, paidAt: new Date()}});
  return wallet;
}

/** What the wallet panel can offer: card/UPI when Razorpay is on, test money where that is allowed. */
topupRoutes.get('/topup/config', requireAuth, (_req, res) => {
  res.json({data: {razorpayKeyId: razorpayConfig()?.keyId ?? null, testTopup: config.testTopupAllowed()}});
});

/** Opens a top-up: the amount is fixed here, on the server, and the browser's checkout pays exactly that. */
topupRoutes.post(
  '/topup/razorpay',
  requireAuth,
  validate(z.object({amount: z.number().positive().max(100000)})),
  async (req, res) => {
    const cfg = razorpayConfig();
    if (!cfg) throw new ApiError(503, 'PAYMENTS_UNAVAILABLE', 'Card and UPI top-ups are not switched on yet');
    const amount = toPaise(req.body.amount);
    if (amount < MIN) throw new ApiError(400, 'INVALID_AMOUNT', 'Add at least ₹1');
    const _id = new mongoose.Types.ObjectId();
    const rzp = await createRazorpayOrder(cfg, amount, `topup-${_id}`);
    await Topup.create({_id, userId: req.user.sub, amount, razorpayOrderId: rzp.id});
    res.json({data: {keyId: cfg.keyId, razorpayOrderId: rzp.id, amount}});
  },
);

/** The browser's success callback. Only a valid signature on the person's own top-up credits anything. */
topupRoutes.post(
  '/topup/razorpay/verify',
  requireAuth,
  validate(
    z.object({
      razorpay_order_id: z.string().max(60),
      razorpay_payment_id: z.string().max(60),
      razorpay_signature: z.string().max(128),
    }),
  ),
  async (req, res) => {
    const cfg = razorpayConfig();
    const topup = await Topup.findOne({razorpayOrderId: req.body.razorpay_order_id, userId: req.user.sub});
    if (!cfg || !topup || !checkoutSignatureOk(cfg.keySecret, req.body)) {
      throw new ApiError(400, 'BAD_SIGNATURE', 'We could not confirm this payment');
    }
    const wallet = await credit(topup, req.body.razorpay_payment_id);
    res.json({data: {balance: wallet.balance}});
  },
);

/** Razorpay's webhook, for when the browser closed before its callback ran. Signed over the raw body. */
topupRoutes.post('/topup/razorpay/webhook', async (req, res) => {
  const cfg = razorpayConfig();
  if (!cfg || !webhookSignatureOk(cfg.webhookSecret, req.rawBody, req.headers['x-razorpay-signature'])) {
    throw new ApiError(400, 'BAD_SIGNATURE', 'Invalid signature');
  }
  const payment = req.body.payload?.payment?.entity;
  if (req.body.event === 'payment.captured' && payment?.order_id) {
    // Order payments reach this hook too; only our own top-ups, for the amount we fixed, are credited.
    const topup = await Topup.findOne({razorpayOrderId: payment.order_id});
    if (topup && payment.amount === topup.amount) await credit(topup, payment.id);
  }
  // Always 200 for a signed call, so Razorpay stops retrying what we have handled or cannot use.
  res.json({data: {ok: true}});
});

/** Test money, for development only: refused in production unless switched on on purpose. */
topupRoutes.post(
  '/topup',
  requireAuth,
  validate(z.object({amount: z.number().positive().max(100000)})),
  async (req, res) => {
    if (!config.testTopupAllowed()) {
      throw new ApiError(403, 'PAYMENTS_UNAVAILABLE', 'Test money is switched off. Add money by card or UPI.');
    }
    const wallet = await move(req.user.sub, 'credit', toPaise(req.body.amount), 'Test top-up');
    res.json({data: {balance: wallet.balance}});
  },
);
