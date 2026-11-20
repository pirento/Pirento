import {Router} from 'express';
import {z} from 'zod';
import {STAFF_TRANSITIONS} from '@pirento/shared';
import {ACCESS, audit, conflict, requireAuth, requireRole, validate} from '@pirento/shared/server';
import {PAID_STATUSES} from '../config.js';
import {Order} from '../models/Order.js';
import {Partner} from '../models/Partner.js';
import {completionCode, findAccessible} from '../lib/orders.js';
import {refundOrder} from '../lib/wallet.js';

// The team's side: numbers, the work queue, and moving orders along.
export const staffRoutes = Router();
staffRoutes.use('/staff', requireAuth, requireRole(...ACCESS.orders));
const DAY = 86_400_000;

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

/** Orders placed and paid value per day for the last 30 days, for the overview charts. */
staffRoutes.get('/staff/daily', async (_req, res) => {
  const rows = await Order.aggregate([
    {$match: {createdAt: {$gte: new Date(Date.now() - 30 * DAY)}}},
    {
      $group: {
        _id: {$dateToString: {format: '%Y-%m-%d', date: '$createdAt'}},
        count: {$sum: 1},
        paid: {$sum: {$cond: [{$in: ['$status', PAID_STATUSES]}, '$amount', 0]}},
      },
    },
    {$sort: {_id: 1}},
  ]);
  res.json({data: rows.map((r) => ({day: r._id, count: r.count, paid: r.paid}))});
});

/** One customer's orders, for the admin user page. */
staffRoutes.get('/staff/user/:userId', async (req, res) => {
  res.json({data: await Order.find({userId: req.params.userId}, {intake: 0}).sort({createdAt: -1}).limit(100)});
});

/** Pirento One partners with the orders and paid value their code brought in. */
staffRoutes.get('/staff/partners', requireRole(...ACCESS.partners), async (_req, res) => {
  const [partners, brought] = await Promise.all([
    Partner.find().sort({createdAt: -1}).limit(300),
    Order.aggregate([
      {$match: {ref: {$exists: true, $ne: null}}},
      {
        $group: {
          _id: '$ref',
          orders: {$sum: 1},
          paid: {$sum: {$cond: [{$in: ['$status', PAID_STATUSES]}, '$amount', 0]}},
        },
      },
    ]),
  ]);
  const byCode = Object.fromEntries(brought.map((b) => [b._id, b]));
  res.json({
    data: partners.map((p) => ({
      userId: p.userId,
      code: p.code,
      joinedAt: p.createdAt,
      orders: byCode[p.code]?.orders ?? 0,
      paid: byCode[p.code]?.paid ?? 0,
    })),
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
    audit(req, `order.${status}`, `#${order.orderNo}`, note);
    // shortcut: a Razorpay-paid cancellation is refunded by hand in the Razorpay dashboard; automate with its refunds API.
    res.json({data: updated});
  },
);
