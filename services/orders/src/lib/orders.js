// Finding orders the caller may see or act on, and moving them to paid.
import crypto from 'node:crypto';
import {serviceQuestions} from '@pirento/shared';
import {canUse, isId, nextSeq, notFound, productScope, razorpayConfig, refundPayment} from '@pirento/shared/server';
import {CODE_PREFIX} from '../config.js';
import {Order} from '../models/Order.js';
import {takeUse} from './coupons.js';

/** Six-digit order numbers, starting at 100001. */
export const nextOrderNo = async () => (await nextSeq('order')) + 100000;

/**
 * The questions an order keeps, since an admin may change a service's questions later: the labels of what checkout
 * asked, and the questions the customer answers after paying.
 */
export const questionsOf = (service) => ({
  asked: serviceQuestions(service).map(({id, label}) => ({id, label})),
  afterQuestions: service.afterQuestions ?? [],
});

/** Finance and superadmins see every order; operations staff see theirs and the unassigned ones. */
export const seesAllWork = (req) => ['finance', 'superadmin'].includes(req.user?.role);

const inScope = (req, order) => productScope(req)?.includes(order.product) ?? true;

/** Support reads orders to answer tickets; operations staff only open work that is theirs or nobody's yet. */
const staffCanSee = (req, order) => {
  if (!inScope(req, order)) return false;
  if (req.user?.role === 'support') return true;
  if (!canUse(req, 'orders')) return false;
  return seesAllWork(req) || !order.assignee?.id || order.assignee.id === req.user.sub;
};

/** The order in the URL, if the caller owns it or may see it as staff. Anyone else gets a 404, not a 403. */
export async function findAccessible(req) {
  const order = isId(req.params.id) && (await Order.findById(req.params.id));
  if (!order || (order.userId !== req.user.sub && !staffCanSee(req, order))) throw notFound('Order not found');
  return order;
}

/** The order in the URL, only if it is the caller's own: paying and cancelling are the customer's acts. */
export async function findOwn(req) {
  const order = isId(req.params.id) && (await Order.findById(req.params.id));
  if (!order || order.userId !== req.user.sub) throw notFound('Order not found');
  return order;
}

/**
 * Moves an order from pending_payment to paid, exactly once, and counts its discount code.
 * Returns null when the order was not pending any more (already paid, or cancelled).
 */
export async function markPaid(id, payment, note) {
  const paid = await Order.findOneAndUpdate(
    {_id: id, status: 'pending_payment'},
    {$set: {status: 'paid', payment}, $push: {timeline: {status: 'paid', note}}},
    {new: true},
  );
  // Counted once per order (a wallet payment took it before debiting; then this is a no-op).
  if (paid) await takeUse(paid, {strict: false});
  return paid;
}

/** A fresh public completion code for a product, or undefined if it has none. */
export const completionCode = (product) =>
  CODE_PREFIX[product] && `${CODE_PREFIX[product]}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

/** Refunds a cancelled card/UPI order's payment to the card or UPI it came from; returns the Razorpay refund id. */
export async function refundCard(order) {
  const cfg = razorpayConfig();
  if (!cfg)
    throw Object.assign(new Error('Razorpay is switched off, so this refund cannot be sent'), {
      status: 503,
      code: 'PAYMENTS_UNAVAILABLE',
    });
  const {razorpayPaymentId: id, refundTries = 0} = order.payment;
  return (await refundPayment(cfg, id, `refund-${id}-${refundTries}`)).id ?? undefined;
}

/**
 * A card/UPI payment captured for an order that was already paid another way, or cancelled.
 * Noted once on the order, where the customer and the team both see it, then refunded in full.
 */
export async function noteExtraPayment(order, paymentId) {
  if (order.payment?.razorpayPaymentId === paymentId) return;
  const noted = await Order.updateOne(
    {_id: order._id, 'payment.extra': {$ne: paymentId}},
    {
      $push: {
        'payment.extra': paymentId,
        timeline: {
          status: order.status,
          note: 'A card/UPI payment arrived after this order was settled. It is being refunded.',
        },
      },
    },
  );
  if (noted.modifiedCount) console.warn(`Extra Razorpay payment ${paymentId} on order ${order.orderNo}`);
  if (order.payment?.extraRefunded?.includes(paymentId)) return;
  // shortcut: a refund that fails here is tried again only when Razorpay reports this payment again (the browser's
  // callback and the webhook both do); add a staff "refund" button if failures show up in the logs.
  try {
    await refundPayment(razorpayConfig(), paymentId, `refund-${paymentId}-extra`);
    await Order.updateOne(
      {_id: order._id, 'payment.extraRefunded': {$ne: paymentId}},
      {
        $push: {
          'payment.extraRefunded': paymentId,
          timeline: {status: order.status, note: 'That extra payment was refunded to your card or UPI.'},
        },
      },
    );
  } catch (err) {
    console.warn(`Refund of extra payment ${paymentId} on order ${order.orderNo} failed: ${err.message}`);
  }
}
