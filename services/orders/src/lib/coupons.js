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

/**
 * Checks a code and counts one use in a single update, so the last use of a
 * limited code cannot be taken by two orders at once.
 * A use is counted when the order is placed; `releaseCoupon` gives it back if the order is cancelled unpaid.
 */
export async function redeem(code, product, amount) {
  const coupon = await Coupon.findOne({code});
  const discount = discountFor(coupon, product, amount);
  const taken = await Coupon.findOneAndUpdate(
    {_id: coupon._id, ...(coupon.maxUses ? {uses: {$lt: coupon.maxUses}} : {})},
    {$inc: {uses: 1}},
  );
  if (!taken) throw refuse('This code has been used up');
  return discount;
}

/** Gives back the use an unpaid, now cancelled order took. Never below zero. */
export const releaseCoupon = (order) =>
  order.coupon ? Coupon.updateOne({code: order.coupon, uses: {$gt: 0}}, {$inc: {uses: -1}}) : null;
