import {Router} from 'express';
import {z} from 'zod';
import {STAFF_TRANSITIONS} from '@pirento/shared';
import {STAFF, conflict, requireAuth, requireRole, validate} from '@pirento/shared/server';
import {PAID_STATUSES} from '../config.js';
import {Order} from '../models/Order.js';
import {completionCode, findAccessible} from '../lib/orders.js';
import {refundOrder} from '../lib/wallet.js';

// The team's side: numbers, the work queue, and moving orders along.
export const staffRoutes = Router();
staffRoutes.use('/staff', requireAuth, requireRole(...STAFF));

staffRoutes.get('/staff/stats', async (_req, res) => {
  const [byStatus, byProduct] = await Promise.all([
    Order.aggregate([{$group: {_id: '$status', count: {$sum: 1}, amount: {$sum: '$amount'}}}]),
    Order.aggregate([
      {$match: {status: {$in: PAID_STATUSES}}},
      {$group: {_id: '$product', count: {$sum: 1}, amount: {$sum: '$amount'}}},
    ]),
  ]);
  const amountOf = Object.fromEntries(byStatus.map((r) => [r._id, r.amount]));
  res.json({
    data: {
      byStatus: Object.fromEntries(byStatus.map((r) => [r._id, r.count])),
      revenue: PAID_STATUSES.reduce((sum, s) => sum + (amountOf[s] ?? 0), 0),
      byProduct: Object.fromEntries(byProduct.map((r) => [r._id, {count: r.count, amount: r.amount}])),
    },
  });
});

/** Default view is the work to do: paid and in-progress orders, oldest first. */
staffRoutes.get('/staff/queue', async (req, res) => {
  const status =
    typeof req.query.status === 'string' && req.query.status in STAFF_TRANSITIONS ? req.query.status : null;
  const filter = status ? {status} : {status: {$in: ['paid', 'in_progress']}};
  res.json({data: await Order.find(filter).sort({createdAt: 1}).limit(200)});
});

staffRoutes.patch(
  '/staff/:id',
  validate(z.object({status: z.enum(['in_progress', 'completed', 'cancelled']), note: z.string().trim().max(300)})),
  async (req, res) => {
    const order = await findAccessible(req);
    const {status, note} = req.body;
    const paidByWallet = order.payment?.method === 'wallet' && !order.payment.refunded;

    // Sending "cancelled" again for a cancelled order retries a wallet refund that failed.
    const retryRefund = status === 'cancelled' && order.status === 'cancelled' && paidByWallet;
    if (!retryRefund && !STAFF_TRANSITIONS[order.status].includes(status)) {
      throw conflict('BAD_TRANSITION', `An order that is ${order.status} cannot become ${status}`);
    }

    let updated = order;
    if (!retryRefund) {
      const set = {status};
      if (status === 'completed') set.code = completionCode(order.product);
      // Conditional on the old status, so two staff clicks cannot both apply.
      updated = await Order.findOneAndUpdate(
        {_id: order._id, status: order.status},
        {$set: set, $push: {timeline: {status, note: note || undefined}}},
        {new: true},
      );
      if (!updated) throw conflict('CHANGED', 'Someone else just updated this order. Reload and try again.');
    }

    if (status === 'cancelled' && paidByWallet) {
      await refundOrder(order);
      updated = await Order.findByIdAndUpdate(
        order._id,
        {$set: {'payment.refunded': true}, $push: {timeline: {status: 'cancelled', note: 'Refunded to your wallet'}}},
        {new: true},
      );
    }
    // shortcut: a Razorpay-paid cancellation is refunded by hand in the Razorpay dashboard; automate with its refunds API.
    res.json({data: updated});
  },
);
