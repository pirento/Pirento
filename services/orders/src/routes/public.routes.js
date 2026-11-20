// Routes that need no sign-in.
import {Router} from 'express';
import {ApiError, notFound} from '@pirento/shared/server';
import {Order} from '../models/Order.js';
import {markPaid, noteExtraPayment} from '../lib/orders.js';
import {razorpayConfig, webhookSignatureOk} from '../lib/razorpay.js';

export const publicRoutes = Router();

/** Tells the browser whether card/UPI payments are switched on. */
publicRoutes.get('/config', (_req, res) => res.json({data: {razorpayKeyId: razorpayConfig()?.keyId ?? null}}));

/** Public check of a completion code. Shows only what proves the work exists, never the customer. */
publicRoutes.get('/verify/:code', async (req, res) => {
  const order = await Order.findOne({code: req.params.code.toUpperCase(), status: 'completed'});
  if (!order) throw notFound('No completed work has this code');
  const done = order.timeline.findLast((t) => t.status === 'completed');
  res.json({data: {code: order.code, serviceName: order.serviceName, product: order.product, completedAt: done?.at}});
});

/** Razorpay tells us a payment was captured. Signed over the raw body with the webhook secret. */
publicRoutes.post('/payments/razorpay/webhook', async (req, res) => {
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
      if (!paid) await noteExtraPayment(await Order.findById(order._id), payment.id);
    }
  }
  res.json({data: {ok: true}});
});
