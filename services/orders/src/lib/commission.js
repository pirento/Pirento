// Pirento One commission: fixed on the order when it completes, then credited to the partner's wallet once.
import {callService, notify} from '@pirento/shared/server';
import {config} from '../config.js';
import {Order} from '../models/Order.js';
import {Partner} from '../models/Partner.js';
import {rateFor} from './plans.js';

/** Paise for `pct` percent of `amount` paise, rounded down. */
export const commissionOf = (amount, pct) => Math.floor((amount * pct) / 100);

/** The commission this order earns at the partner's plan rate today, or null. */
export async function commissionFor(order) {
  if (!order.ref || !order.amount) return null;
  const partner = await Partner.findOne({code: order.ref}).lean();
  if (!partner) return null;
  const pct = await rateFor(partner);
  const amount = commissionOf(order.amount, pct);
  return amount > 0 ? {userId: partner.userId, pct, amount} : null;
}

/** Credits an unpaid commission. Safe to call again: the wallet applies ref `commission-<order id>` once. */
export async function payCommission(order) {
  const c = order.commission;
  if (!c?.amount || c.paid) return false;
  await callService(config.walletUrl, '/internal/credit', {
    userId: c.userId,
    amount: c.amount,
    ref: `commission-${order._id}`,
    note: `Pirento One commission, order #${order.orderNo}`,
  });
  await Order.updateOne({_id: order._id}, {$set: {'commission.paid': true}});
  notify(c.userId, {
    brand: 'Pirento One',
    label: `Order #${order.orderNo}`,
    big: `₹${(c.amount / 100).toLocaleString('en-IN')} commission`,
    note: 'An order placed through your link is complete. Your commission is in your wallet.',
  });
  return true;
}
