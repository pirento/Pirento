// Discount codes: checking one at checkout, and counting its use once the order is paid.
import {ApiError} from '@pirento/shared/server';
import {Coupon} from '../models/Coupon.js';

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

/**
 * Counts one use once the order is paid, so unpaid orders can never use up a limited code.
 * A payment is never refused over it: if the last use was taken while this order sat unpaid,
 * the count may go one past the limit.
 */
export const countUse = (order) => (order.coupon ? Coupon.updateOne({code: order.coupon}, {$inc: {uses: 1}}) : null);
