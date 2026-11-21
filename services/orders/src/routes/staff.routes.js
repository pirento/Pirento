// The team's side: numbers, the work queue, and moving orders along.
import {Router} from 'express';
import {z} from 'zod';
import {STAFF_TRANSITIONS, validateIntake} from '@pirento/shared';
import {
  ACCESS,
  ApiError,
  audit,
  badInput,
  callService,
  conflict,
  productScope,
  requireAuth,
  requireRole,
  validate,
} from '@pirento/shared/server';
import {PAID_STATUSES, config} from '../config.js';
import {liveService} from '../lib/catalog.js';
import {Order} from '../models/Order.js';
import {Partner} from '../models/Partner.js';
import {completionCode, findAccessible, nextOrderNo, seesAllWork} from '../lib/orders.js';
import {refundOrder} from '../lib/wallet.js';

export const staffRoutes = Router();
staffRoutes.use('/staff', requireAuth, requireRole(...ACCESS.orders));
const DAY = 86_400_000;

/** The filter that keeps product-scoped staff to their products. */
const scoped = (req, filter = {}) => {
  const products = productScope(req);
  return products ? {...filter, product: {$in: products}} : filter;
};

// Money totals are for finance and superadmins; operations staff see their own work instead.
const money = requireRole(...ACCESS.payments);

staffRoutes.get('/staff/stats', money, async (req, res) => {
  const [byStatus, byProduct] = await Promise.all([
    Order.aggregate([{$match: scoped(req)}, {$group: {_id: '$status', count: {$sum: 1}, amount: {$sum: '$amount'}}}]),
    Order.aggregate([
      {$match: scoped(req, {status: {$in: PAID_STATUSES}})},
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
staffRoutes.get('/staff/daily', money, async (req, res) => {
  const rows = await Order.aggregate([
    {$match: scoped(req, {createdAt: {$gte: new Date(Date.now() - 30 * DAY)}})},
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
  res.json({
    data: await Order.find(scoped(req, {userId: req.params.userId}), {intake: 0})
      .sort({createdAt: -1})
      .limit(100),
  });
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

/**
 * Default view is the work to do: paid and in-progress orders, oldest first.
 * Operations staff get their own orders and the unassigned ones they can take.
 */
staffRoutes.get('/staff/queue', async (req, res) => {
  const status =
    typeof req.query.status === 'string' && req.query.status in STAFF_TRANSITIONS ? req.query.status : null;
  const filter = scoped(req, status ? {status} : {status: {$in: ['paid', 'in_progress']}});
  // One product's orders (?product=legal), never outside the staffer's own products.
  const scope = productScope(req);
  if (typeof req.query.product === 'string' && (!scope || scope.includes(req.query.product))) {
    filter.product = req.query.product;
  }
  if (req.query.mine === '1') filter['assignee.id'] = req.user.sub;
  else if (!seesAllWork(req)) filter.$or = [{'assignee.id': req.user.sub}, {'assignee.id': {$exists: false}}];
  res.json({data: await Order.find(filter).sort({createdAt: 1}).limit(200)});
});

/**
 * Book a service for a customer (on a call, at the desk). The order lands unpaid in their dashboard and they pay
 * it there: no money moves here, the price is the catalogue's, and the answers pass the same checks as checkout.
 */
staffRoutes.post(
  '/staff/book',
  requireRole(...ACCESS.booking),
  validate(
    z.object({
      userId: z.string().max(40),
      serviceSlug: z.string().max(80),
      intake: z.record(z.string(), z.string()).default({}),
      note: z.string().trim().max(500).default(''),
    }),
  ),
  async (req, res) => {
    const service = await liveService(req.body.serviceSlug);
    if (!service?.price) throw new ApiError(400, 'NOT_FOR_SALE', 'This service cannot be bought online yet');
    const scope = productScope(req);
    if (scope && !scope.includes(service.product)) throw badInput('That product is not one you work on');
    const settings = await callService(config.catalogUrl, '/internal/settings', {}).catch(() => null);
    if (settings?.paused.includes(service.product)) {
      throw new ApiError(503, 'PAUSED', 'Orders for this product are paused for now');
    }
    const customer = await callService(config.authUrl, '/internal/user', {id: req.body.userId});
    if (!customer || customer.role !== 'customer' || customer.suspended) {
      throw badInput('Choose an active customer account');
    }
    const {answers, error} = validateIntake(service.product, service.slug, req.body.intake);
    if (error) throw badInput(error);

    const order = await Order.create({
      orderNo: await nextOrderNo(),
      userId: customer.id,
      email: customer.email,
      product: service.product,
      serviceSlug: service.slug,
      serviceName: service.name,
      quantity: 1,
      amount: service.price * 100,
      intake: answers,
      bookedBy: {id: req.user.sub, email: req.user.email},
      timeline: [{status: 'pending_payment', note: 'Booked for you by the Pirento team'}],
      ...(req.body.note ? {messages: [{from: 'team', body: req.body.note, by: req.user.email}]} : {}),
    });
    audit(req, 'order.book', `#${order.orderNo}`, `${service.slug} for ${customer.email}`);
    res.status(201).json({data: order});
  },
);

/** Open work per staffer, for the team page. */
staffRoutes.get('/staff/workload', requireRole('superadmin'), async (_req, res) => {
  const rows = await Order.aggregate([
    {$match: {status: {$in: ['paid', 'in_progress']}, 'assignee.id': {$exists: true}}},
    {$group: {_id: '$assignee.id', open: {$sum: 1}}},
  ]);
  const unassigned = await Order.countDocuments({
    status: {$in: ['paid', 'in_progress']},
    'assignee.id': {$exists: false},
  });
  res.json({data: {byStaff: Object.fromEntries(rows.map((r) => [r._id, r.open])), unassigned}});
});

/** Give an order to a staffer (or take it back). The browser names them; their role is checked in auth's team list. */
staffRoutes.patch(
  '/staff/:id/assign',
  validate(z.object({assignee: z.object({id: z.string().min(1).max(40), email: z.email()}).nullable()})),
  async (req, res) => {
    const order = await findAccessible(req);
    const {assignee} = req.body;
    // Anyone may take work for themselves; handing it to someone else is a superadmin's call.
    if (assignee && assignee.id !== req.user.sub && req.user.role !== 'superadmin') {
      throw conflict('NOT_YOURS', 'Only a superadmin can assign work to someone else');
    }
    const updated = await Order.findByIdAndUpdate(order._id, assignee ? {$set: {assignee}} : {$unset: {assignee: 1}}, {
      new: true,
    });
    audit(req, 'order.assign', `#${order.orderNo}`, assignee?.email ?? 'unassigned');
    res.json({data: updated});
  },
);

/** A message to the customer in the order's conversation, without changing its status. */
staffRoutes.post(
  '/staff/:id/message',
  validate(z.object({note: z.string().trim().min(2).max(1000)})),
  async (req, res) => {
    const order = await findAccessible(req);
    const updated = await Order.findByIdAndUpdate(
      order._id,
      {$push: {messages: {from: 'team', body: req.body.note, by: req.user.email}}},
      {new: true},
    );
    audit(req, 'order.message', `#${order.orderNo}`, req.body.note);
    res.json({data: updated});
  },
);

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
