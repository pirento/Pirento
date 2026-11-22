// Adding money to the wallet by card or UPI (Razorpay), plus test money where that is allowed.
import {Router} from 'express';
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
import {newId, query} from '../lib/db.js';
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
    topup.user_id,
    'credit',
    topup.amount,
    'Added by card or UPI',
    `topup-${topup.razorpay_order_id}`,
  );
  await query('UPDATE topups SET payment_id = $2, paid_at = now() WHERE id = $1 AND paid_at IS NULL', [
    topup.id,
    paymentId,
  ]);
  return wallet;
}

const topupBy = async (orderId, userId) =>
  (
    await query(
      `SELECT * FROM topups WHERE razorpay_order_id = $1${userId ? ' AND user_id = $2' : ''}`,
      userId ? [orderId, userId] : [orderId],
    )
  ).rows[0];

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
    const id = newId();
    const rzp = await createRazorpayOrder(cfg, amount, `topup-${id}`);
    await query('INSERT INTO topups (id, user_id, amount, razorpay_order_id) VALUES ($1, $2, $3, $4)', [
      id,
      req.user.sub,
      amount,
      rzp.id,
    ]);
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
    const topup = await topupBy(req.body.razorpay_order_id, req.user.sub);
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
    const topup = await topupBy(payment.order_id);
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
