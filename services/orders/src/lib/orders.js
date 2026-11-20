// Finding orders the caller may see or act on, and moving them to paid.
import crypto from 'node:crypto';
import {canUse, isId, nextSeq, notFound, productScope} from '@pirento/shared/server';
import {CODE_PREFIX} from '../config.js';
import {Order} from '../models/Order.js';
import {countUse} from './coupons.js';

/** Six-digit order numbers, starting at 100001. */
export const nextOrderNo = async () => (await nextSeq('order')) + 100000;

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
  // Only the payment that moved the order counts the code, so a retry never counts it twice.
  if (paid) await countUse(paid);
  return paid;
}

/** A fresh public completion code for a product, or undefined if it has none. */
export const completionCode = (product) =>
  CODE_PREFIX[product] && `${CODE_PREFIX[product]}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

/**
 * A card/UPI payment captured for an order that was already paid another way, or cancelled.
 * Noted once on the order, where the customer and the team both see it, so it gets refunded.
 */
export async function noteExtraPayment(order, paymentId) {
  if (order.payment?.razorpayPaymentId === paymentId) return;
  // shortcut: refunded by hand in the Razorpay dashboard; automate with its refunds API.
  const noted = await Order.updateOne(
    {_id: order._id, 'payment.extra': {$ne: paymentId}},
    {
      $push: {
        'payment.extra': paymentId,
        timeline: {
          status: order.status,
          note: 'A card/UPI payment arrived after this order was settled. Our team will refund it.',
        },
      },
    },
  );
  if (noted.modifiedCount) console.warn(`Extra Razorpay payment ${paymentId} on order ${order.orderNo}`);
}
