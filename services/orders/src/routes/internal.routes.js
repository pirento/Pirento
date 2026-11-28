// Called by the auth service when an account is deleted. Orders stay for accounts and tax records,
// but without the person: their email, their checkout answers, their messages and their documents go.
import {Router} from 'express';
import {z} from 'zod';
import {GREEN_DONATION} from '@pirento/shared';
import {dropFiles, isId, notFound, requireInternal, validate} from '@pirento/shared/server';
import {orderFacts} from '../lib/facts.js';
import {Order} from '../models/Order.js';
import {Shipment} from '../models/Shipment.js';
import {OrderFile} from '../models/OrderFile.js';
import {Partner} from '../models/Partner.js';

export const internalRoutes = Router();
internalRoutes.use('/internal', requireInternal);

internalRoutes.post('/internal/forget', validate(z.object({userId: z.string().min(1).max(40)})), async (req, res) => {
  const {userId} = req.body;
  const stored = await OrderFile.find({userId, blobKey: {$exists: true}}, {blobKey: 1}).lean();
  await Promise.all([
    // A courier tracking number leads to their address, so it goes with the answers.
    Order.updateMany(
      {userId},
      {
        $set: {email: `deleted-${userId}@deleted.invalid`, intake: {}},
        $unset: {'fulfilment.tracking': 1, details: 1},
      },
    ),
    // What they wrote to the team goes too; the team's side of the conversation stays as a record of the work.
    Order.updateMany(
      {userId},
      {$set: {'messages.$[mine].body': '[removed when the account was deleted]'}},
      {arrayFilters: [{'mine.from': 'customer'}]},
    ),
    OrderFile.deleteMany({userId}),
    // A parcel's address and mobile are theirs; the parcel stays as a record of what was sent.
    Shipment.updateMany({userId}, {$set: {'to.name': 'Deleted account'}, $unset: {'to.address': 1, 'to.mobile': 1}}),
    Partner.deleteMany({userId}),
    // Commission not yet in their wallet is dropped: the account is going, and a credit would reopen its wallet.
    Order.updateMany({'commission.userId': userId, 'commission.paid': {$ne: true}}, {$unset: {commission: 1}}),
  ]);
  await dropFiles(stored);
  res.json({data: {forgotten: true}});
});

/** Pirento AI's look at a person's own orders: number, service, status and amount of the latest ten. */
internalRoutes.post(
  '/internal/assistant',
  validate(z.object({userId: z.string().min(1).max(40)})),
  async (req, res) => {
    const orders = await Order.find(
      {userId: req.body.userId},
      {orderNo: 1, product: 1, serviceName: 1, status: 1, amount: 1, createdAt: 1},
    )
      .sort({createdAt: -1})
      .limit(10)
      .lean();
    res.json({
      data: orders.map((o) => ({
        orderNo: o.orderNo,
        product: o.product,
        service: o.serviceName,
        status: o.status,
        rupees: o.amount / 100,
        placed: o.createdAt,
        link: `/${o.product}/dashboard/orders/${o._id}`,
      })),
    });
  },
);

/** Pirento AI's partner coach: the person's Pirento One code, plan and the orders their code brought (no buyers). */
internalRoutes.post(
  '/internal/partner-summary',
  validate(z.object({userId: z.string().min(1).max(40)})),
  async (req, res) => {
    const partner = await Partner.findOne({userId: req.body.userId}).lean();
    if (!partner) return res.json({data: null});
    const orders = await Order.find(
      {ref: partner.code},
      {serviceName: 1, product: 1, status: 1, commission: 1, createdAt: 1},
    )
      .sort({createdAt: -1})
      .limit(100)
      .lean();
    res.json({
      data: {
        code: partner.code,
        plan: partner.plan?.name ?? 'Free',
        referredOrders: orders.map((o) => ({
          service: o.serviceName,
          product: o.product,
          status: o.status,
          commissionRupees: o.commission?.amount ? o.commission.amount / 100 : 0,
          at: o.createdAt,
        })),
      },
    });
  },
);

/** Pirento AI's admin answers: live order counts by status and product, and paid orders waiting over 3 days. */
internalRoutes.post('/internal/staff-summary', validate(z.object({}).passthrough()), async (_req, res) => {
  const stale = new Date(Date.now() - 3 * 86_400_000);
  const [byStatus, waiting, today] = await Promise.all([
    Order.aggregate([{$group: {_id: {status: '$status', product: '$product'}, n: {$sum: 1}}}]),
    Order.find(
      {status: {$in: ['paid', 'in_progress']}, updatedAt: {$lt: stale}},
      {orderNo: 1, product: 1, serviceName: 1, status: 1, updatedAt: 1},
    )
      .sort({updatedAt: 1})
      .limit(20)
      .lean(),
    Order.countDocuments({createdAt: {$gte: new Date(new Date().toISOString().slice(0, 10))}}),
  ]);
  res.json({
    data: {
      byStatus: byStatus.map((r) => ({...r._id, count: r.n})),
      placedToday: today,
      waitingOver3Days: waiting.map(({_id, ...o}) => o),
    },
  });
});

/** Pirento AI's look at one order for its own customer (the Legal tools); anyone else's order is not found. */
internalRoutes.post(
  '/internal/order-summary',
  validate(z.object({orderId: z.string().min(1).max(40), userId: z.string().min(1).max(40)})),
  async (req, res) => {
    const order = isId(req.body.orderId) && (await Order.findById(req.body.orderId));
    if (!order || order.userId !== req.body.userId) throw notFound('Order not found');
    res.json({data: await orderFacts(order)});
  },
);

/**
 * Pirento Green's market: a person's planted sponsorships, the trees its credits grow from. Only paid orders with a
 * planting record count, and growth starts on the planting date the team wrote (or when they wrote it).
 */
internalRoutes.post(
  '/internal/green-trees',
  validate(z.object({userId: z.string().min(1).max(40)})),
  async (req, res) => {
    const orders = await Order.find(
      {
        userId: req.body.userId,
        product: 'green',
        serviceSlug: {$ne: GREEN_DONATION.slug}, // donated trees grow no credits for the giver
        status: {$in: ['paid', 'in_progress', 'completed']},
        'fulfilment.site': {$exists: true},
      },
      {orderNo: 1, serviceSlug: 1, serviceName: 1, quantity: 1, fulfilment: 1},
    ).lean();
    res.json({
      data: orders.map((o) => ({
        orderId: String(o._id),
        orderNo: o.orderNo,
        slug: o.serviceSlug,
        name: o.serviceName,
        trees: o.quantity,
        site: o.fulfilment.site,
        plantedAt: o.fulfilment.plantedOn ? new Date(`${o.fulfilment.plantedOn}T00:00:00+05:30`) : o.fulfilment.at,
      })),
    });
  },
);
