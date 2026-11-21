// The team's side: numbers, the work queue, and moving orders along.
import {Router} from 'express';
import {z} from 'zod';
import {
  FULFILMENT,
  STAFF_TRANSITIONS,
  getProduct,
  statusLabel,
  validateFulfilment,
  validateIntake,
} from '@pirento/shared';
import {
  ACCESS,
  ApiError,
  audit,
  badInput,
  callService,
  conflict,
  notify,
  productScope,
  requireAuth,
  requireRole,
  searchFilter,
  validate,
} from '@pirento/shared/server';
import {PAID_STATUSES, config} from '../config.js';
import {liveService} from '../lib/catalog.js';
import {Order} from '../models/Order.js';
import {Partner} from '../models/Partner.js';
import {completionCode, findAccessible, nextOrderNo, questionsOf, refundCard, seesAllWork} from '../lib/orders.js';
import {refundOrder} from '../lib/wallet.js';

export const staffRoutes = Router();
staffRoutes.use('/staff', requireAuth, requireRole(...ACCESS.orders));
const DAY = 86_400_000;

/** Emails the customer about their order, in that product's name. */
const tell = (order, big, note) =>
  notify(order.userId, {brand: getProduct(order.product)?.name, label: `Order #${order.orderNo}`, big, note});

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
    data: await Order.find(scoped(req, {userId: req.params.userId}), {intake: 0, details: 0})
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
  // A search (?q=100031, an email, a service) looks across every status unless one is asked for.
  const search = searchFilter(req.query.q, 'orderNo', ['email', 'serviceName']);
  const filter = scoped(req, status ? {status} : search ? {} : {status: {$in: ['paid', 'in_progress']}});
  if (search) filter.$and = [search];
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
    const {answers, error} = validateIntake(service, req.body.intake);
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
      ...questionsOf(service),
      bookedBy: {id: req.user.sub, email: req.user.email},
      timeline: [{status: 'pending_payment', note: 'Booked for you by the Pirento team'}],
      ...(req.body.note ? {messages: [{from: 'team', body: req.body.note, by: req.user.email}]} : {}),
    });
    audit(req, 'order.book', `#${order.orderNo}`, `${service.slug} for ${customer.email}`);
    tell(
      order,
      'Ready to pay',
      `Our team booked ${service.name} for you. Pay for it from your dashboard to get started.`,
    );
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

/** The delivery record of a Green or Giftox order: where the trees went in, or which courier has the box. */
staffRoutes.patch(
  '/staff/:id/fulfilment',
  validate(z.object({details: z.record(z.string(), z.string().max(500))})),
  async (req, res) => {
    const order = await findAccessible(req);
    const {answers, error} = validateFulfilment(order.product, req.body.details);
    if (error) throw badInput(error);
    // Only paid work that is still live; conditional, so a cancel in between wins.
    const updated = await Order.findOneAndUpdate(
      {_id: order._id, status: {$in: ['paid', 'in_progress', 'completed']}},
      {$set: {fulfilment: {...answers, by: req.user.email, at: new Date()}}},
      {new: true},
    );
    if (!updated) throw conflict('NOT_LIVE', 'Record a delivery only on a paid order that is not cancelled');
    audit(req, 'order.fulfilment', `#${order.orderNo}`, Object.values(answers).join(' · '));
    const spec = FULFILMENT[order.product];
    tell(order, spec.title, spec.note(order, answers));
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
    tell(order, 'New message', `The team wrote about ${order.serviceName}: "${req.body.note.slice(0, 300)}"`);
    res.json({data: updated});
  },
);

staffRoutes.patch(
  '/staff/:id',
  validate(z.object({status: z.enum(['in_progress', 'completed', 'cancelled']), note: z.string().trim().max(300)})),
  async (req, res) => {
    const order = await findAccessible(req);
    const {status, note} = req.body;
    // Money to give back: a wallet payment to the wallet, a card/UPI payment through Razorpay.
    const owed = ['wallet', 'razorpay'].includes(order.payment?.method) && !order.payment.refunded;

    // Sending "cancelled" again for a cancelled order retries a refund that failed.
    const retryRefund = status === 'cancelled' && order.status === 'cancelled' && owed;
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

    if (status === 'cancelled' && owed) {
      // Both are idempotent (the wallet by ref, Razorpay by key), so two quick retries refund once.
      const card = order.payment.method === 'razorpay';
      let refundId;
      if (card) refundId = await refundCard(order);
      else await refundOrder(order);
      const done = card ? 'Refunded to your card or UPI; banks take 5 to 7 working days' : 'Refunded to your wallet';
      updated =
        (await Order.findOneAndUpdate(
          {_id: order._id, 'payment.refunded': {$ne: true}},
          {
            $set: {'payment.refunded': true, ...(refundId && {'payment.refundId': refundId})},
            $push: {timeline: {status: 'cancelled', note: done}},
          },
          {new: true},
        )) ?? (await Order.findById(order._id));
    }
    audit(req, `order.${status}`, `#${order.orderNo}`, note);
    if (!retryRefund) {
      tell(
        order,
        statusLabel(status),
        `${order.serviceName}${note ? `: ${note}` : ''}. Open your dashboard for the details.`,
      );
    }
    res.json({data: updated});
  },
);
