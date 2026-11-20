// Finding orders the caller may see or act on, and moving them to paid.
import crypto from 'node:crypto';
import {canUse, isId, nextSeq, notFound, productScope} from '@pirento/shared/server';
import {CODE_PREFIX} from '../config.js';
import {Order} from '../models/Order.js';

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
