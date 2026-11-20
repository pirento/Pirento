import crypto from 'node:crypto';
import {canUse, isId, nextSeq, notFound, productScope} from '@pirento/shared/server';
import {CODE_PREFIX} from '../config.js';
import {Order} from '../models/Order.js';

/** Six-digit order numbers, starting at 100001. */
export const nextOrderNo = async () => (await nextSeq('order')) + 100000;

/** Staff who may read any order (support reads them to answer tickets), within their product scope. */
const staffCanSee = (req, order) =>
  (canUse(req, 'orders') || canUse(req, 'support')) && (productScope(req)?.includes(order.product) ?? true);

/** The order in the URL, if the caller owns it or may see it as staff. Anyone else gets a 404, not a 403. */
export async function findAccessible(req) {
  const order = isId(req.params.id) && (await Order.findById(req.params.id));
  if (!order || (order.userId !== req.user.sub && !staffCanSee(req, order))) throw notFound('Order not found');
  return order;
}

/**
 * Moves an order from pending_payment to paid, exactly once.
 * Returns null when the order was not pending any more (already paid, or cancelled).
 */
export const markPaid = (id, payment, note) =>
  Order.findOneAndUpdate(
    {_id: id, status: 'pending_payment'},
    {$set: {status: 'paid', payment}, $push: {timeline: {status: 'paid', note}}},
    {new: true},
  );

/** A fresh public completion code for a product, or undefined if it has none. */
export const completionCode = (product) =>
  CODE_PREFIX[product] && `${CODE_PREFIX[product]}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
