// Paying for an order: from the wallet, or by card/UPI through Razorpay.
import {Router} from 'express';
import {z} from 'zod';
import {ApiError, conflict, requireAuth, validate} from '@pirento/shared/server';
import {Order} from '../models/Order.js';
import {findOwn, markPaid} from '../lib/orders.js';
import {debitForOrder, voidOrderDebit} from '../lib/wallet.js';
import {checkoutSignatureOk, createRazorpayOrder, razorpayConfig} from '../lib/razorpay.js';

export const paymentRoutes = Router();
paymentRoutes.use('/:id/pay', requireAuth);

const notPayable = () => conflict('NOT_PAYABLE', 'This order is already settled');

paymentRoutes.post('/:id/pay/wallet', async (req, res) => {
  const order = await findOwn(req);
  if (order.status !== 'pending_payment') throw notPayable();

  await debitForOrder(order);
  const paid = await markPaid(order._id, {method: 'wallet'}, 'Paid from wallet');
  if (paid) return res.json({data: paid});

  // Not pending any more. If a parallel retry of this same wallet payment got
  // there first, our debit was the same (idempotent) debit: nothing to undo.
  const now = await Order.findById(order._id);
  if (now.payment?.method === 'wallet') return res.json({data: now});

  // Settled another way, or cancelled, while we were debiting: give the money back.
  await voidOrderDebit(order);
  throw conflict('NOT_PAYABLE', 'This order was already settled. Your wallet was refunded.');
});

/** Creates (once) the Razorpay order the browser's checkout window needs. */
paymentRoutes.post('/:id/pay/razorpay', async (req, res) => {
  const cfg = razorpayConfig();
  if (!cfg) throw new ApiError(503, 'PAYMENTS_UNAVAILABLE', 'Card and UPI payments are not switched on yet');
  let order = await findOwn(req);
  if (order.status !== 'pending_payment') throw notPayable();

  if (!order.payment?.razorpayOrderId) {
    const rzp = await createRazorpayOrder(cfg, order.amount, `order-${order.orderNo}`);
    order = await Order.findByIdAndUpdate(order._id, {'payment.razorpayOrderId': rzp.id}, {new: true});
  }
  res.json({
    data: {keyId: cfg.keyId, razorpayOrderId: order.payment.razorpayOrderId, amount: order.amount, email: order.email},
  });
});

/** The browser's success callback. We trust the signature, never the browser's word. */
paymentRoutes.post(
  '/:id/pay/razorpay/verify',
  validate(
    z.object({
      razorpay_order_id: z.string().max(60),
      razorpay_payment_id: z.string().max(60),
      razorpay_signature: z.string().max(128),
    }),
  ),
  async (req, res) => {
    const cfg = razorpayConfig();
    const order = await findOwn(req);
    const genuine =
      cfg &&
      order.payment?.razorpayOrderId === req.body.razorpay_order_id &&
      checkoutSignatureOk(cfg.keySecret, req.body);
    if (!genuine) throw new ApiError(400, 'BAD_SIGNATURE', 'We could not confirm this payment');

    const paid = await markPaid(
      order._id,
      {
        method: 'razorpay',
        razorpayOrderId: req.body.razorpay_order_id,
        razorpayPaymentId: req.body.razorpay_payment_id,
      },
      'Paid with Razorpay',
    );
    // Already paid (the webhook can arrive first): just return the order as it is.
    res.json({data: paid ?? (await Order.findById(order._id))});
  },
);
