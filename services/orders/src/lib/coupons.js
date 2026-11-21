// Discount codes: checking one at checkout, and counting its use, once, when the order is paid.
import {ApiError} from '@pirento/shared/server';
import {Coupon} from '../models/Coupon.js';
import {Order} from '../models/Order.js';

const refuse = (message) => new ApiError(400, 'COUPON', message);

/**
 * Paise off `amount` (paise) for this coupon, or an error saying why it does not apply.
 * The total never drops below ₹1, so every order still goes through a payment.
 */
export function discountFor(coupon, product, amount, now = new Date()) {
  if (!coupon || !coupon.active) throw refuse('This code is not valid');
  if (coupon.expiresAt && coupon.expiresAt < now) throw refuse('This code has expired');
  if (coupon.maxUses && coupon.uses >= coupon.maxUses) throw refuse('This code has been used up');
  if (coupon.product && coupon.product !== product) throw refuse('This code does not work on this product');
  if (amount < coupon.minAmount * 100) throw refuse(`This code needs an order of at least ₹${coupon.minAmount}`);
  const off = coupon.kind === 'percent' ? Math.floor((amount * Math.min(coupon.value, 100)) / 100) : coupon.value * 100;
  return Math.min(off, amount - 100);
}

/** The discount a code gives this order, checked when the order is placed. Nothing is counted yet. */
export async function discountOf(code, product, amount) {
  return discountFor(await Coupon.findOne({code}), product, amount);
}

// A code with room left: no limit, or fewer uses than its limit. Read inside the update, so it is atomic.
const ROOM = {$or: [{maxUses: 0}, {$expr: {$lt: ['$uses', '$maxUses']}}]};

/**
 * Takes one use of the order's code, at most once per order (a flag on the order is claimed first, so
 * parallel retries of one payment count once). `strict` refuses when the code is used up, for a payment
 * that has not moved money yet; after money has moved (a card payment arrived) it always counts.
 * Returns false only when a strict take found no room.
 */
export async function takeUse(order, {strict}) {
  if (!order.coupon) return true;
  const claimed = await Order.updateOne({_id: order._id, couponCounted: {$ne: true}}, {$set: {couponCounted: true}});
  if (!claimed.modifiedCount) return true; // already counted for this order
  const took = await Coupon.updateOne({code: order.coupon, ...(strict ? ROOM : {})}, {$inc: {uses: 1}});
  if (took.modifiedCount) return true;
  await Order.updateOne({_id: order._id}, {$unset: {couponCounted: 1}});
  return false;
}

/** Hands a use back when the payment it was taken for did not go through. */
export async function returnUse(order) {
  if (!order.coupon) return;
  const released = await Order.updateOne({_id: order._id, couponCounted: true}, {$unset: {couponCounted: 1}});
  if (released.modifiedCount) await Coupon.updateOne({code: order.coupon, uses: {$gt: 0}}, {$inc: {uses: -1}});
}

/** Whether the order's code still has room, before a card payment starts. */
export async function codeHasRoom(order) {
  return !order.coupon || order.couponCounted || Boolean(await Coupon.exists({code: order.coupon, ...ROOM}));
}
