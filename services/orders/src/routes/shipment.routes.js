// Admin → Shipments: every parcel sent with Blue Dart. A paid Giftox order makes and books its own parcel (lib/
// shipments.js); staff book others by hand, fix and book a parcel the automatic check held back, print its label and
// invoice, and set shipping up: automatic on or off, the pickup address, and each service's parcel (the services are
// listed from the catalogue and can only be edited, never added or removed here).
import {Router} from 'express';
import {z} from 'zod';
import {getProduct} from '@pirento/shared';
import {
  ACCESS,
  audit,
  conflict,
  isId,
  nextSeq,
  notFound,
  requireAuth,
  requireRole,
  searchFilter,
  validate,
} from '@pirento/shared/server';
import {bluedartOn} from '../config.js';
import {Invoice} from '../models/Invoice.js';
import {Order} from '../models/Order.js';
import {SHIPMENT_STATUSES, Shipment} from '../models/Shipment.js';
import {ShipProduct, ShipSettings} from '../models/ShipSettings.js';
import {bookShipment, shipSettings, shipperOf, shippableServices, sweepOrders, trackOne} from '../lib/shipments.js';

export const shipmentRoutes = Router();
shipmentRoutes.use(['/staff/shipments', '/staff/shipping'], requireAuth, requireRole(...ACCESS.shipping));

const LIVE_ORDERS = ['paid', 'in_progress', 'completed'];
const PINCODE = /^[1-9]\d{5}$/;
const MOBILE = /^[6-9]\d{9}$/;
const toSchema = z.object({
  name: z.string().trim().min(2, 'Who it goes to').max(80),
  address: z.string().trim().min(10, 'Enter the full address').max(300),
  pincode: z.string().regex(PINCODE, 'Enter a 6-digit PIN code'),
  mobile: z.string().regex(MOBILE, 'Enter a 10-digit mobile number'),
});

// ── Settings ────────────────────────────────────────────────────────────

shipmentRoutes.get('/staff/shipping/settings', async (_req, res) => {
  const settings = await shipSettings();
  res.json({data: {on: bluedartOn(), settings, shipper: shipperOf(settings), services: await shippableServices()}});
});

shipmentRoutes.put(
  '/staff/shipping/settings',
  validate(
    z.object({
      auto: z.boolean(),
      shipper: toSchema.nullable().default(null), // null: the BLUEDART_SHIPPER_* defaults
    }),
  ),
  async (req, res) => {
    const settings = await ShipSettings.findOneAndUpdate(
      {_id: 'main'},
      req.body.shipper
        ? {$set: {auto: req.body.auto, shipper: req.body.shipper, updatedBy: req.user.email}}
        : {$set: {auto: req.body.auto, updatedBy: req.user.email}, $unset: {shipper: 1}},
      {upsert: true, new: true},
    );
    audit(req, 'shipping.settings', 'main', `${req.body.auto ? 'automatic' : 'by hand'}`);
    res.json({data: settings});
  },
);

/** One service's parcel. Only services the catalogue lists as shippable; none is added or removed here. */
shipmentRoutes.put(
  '/staff/shipping/services/:slug',
  validate(
    z.object({
      autoShip: z.boolean(),
      weightKg: z.number().min(0.05).max(50),
      lengthCm: z.number().int().min(1).max(200),
      breadthCm: z.number().int().min(1).max(200),
      heightCm: z.number().int().min(1).max(200),
    }),
  ),
  async (req, res) => {
    const known = (await shippableServices()).some((s) => s.slug === req.params.slug);
    if (!known) throw notFound('Not a shippable service');
    const row = await ShipProduct.findOneAndUpdate(
      {slug: req.params.slug},
      {$set: {...req.body, updatedBy: req.user.email}},
      {upsert: true, new: true},
    );
    audit(req, 'shipping.service', req.params.slug, `${req.body.weightKg} kg${req.body.autoShip ? '' : ', by hand'}`);
    res.json({data: row});
  },
);

/** Runs the automatic pass now: parcels for paid orders that have none yet. */
shipmentRoutes.post('/staff/shipping/sweep', async (req, res) => {
  const made = await sweepOrders();
  audit(req, 'shipping.sweep', 'orders', String(made));
  res.json({data: {made}});
});

// ── Parcels ─────────────────────────────────────────────────────────────

shipmentRoutes.get('/staff/shipments', async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  // A long number is a waybill; a short one a parcel or order number; words a name or what is inside.
  const search = /^\d{9,}$/.test(q)
    ? {awb: q}
    : /^#?\d{1,8}$/.test(q)
      ? {$or: [{shipmentNo: Number(q.replace('#', ''))}, {orderNo: Number(q.replace('#', ''))}]}
      : searchFilter(q, null, ['to.name', 'purpose']);
  const status = SHIPMENT_STATUSES.includes(req.query.status) ? {status: req.query.status} : {};
  const review = req.query.review === '1' ? {'review.0': {$exists: true}, awb: {$exists: false}} : {};
  const [items, counts, waiting] = await Promise.all([
    Shipment.find({...status, ...review, ...search})
      .sort({createdAt: -1})
      .limit(100),
    Shipment.aggregate([{$group: {_id: '$status', n: {$sum: 1}}}]),
    Shipment.countDocuments({'review.0': {$exists: true}, awb: {$exists: false}, status: 'created'}),
  ]);
  res.json({
    data: {on: bluedartOn(), items, waiting, counts: Object.fromEntries(counts.map((c) => [c._id, c.n]))},
  });
});

/** Books a parcel by hand. With an order number, it is that order's box. */
shipmentRoutes.post(
  '/staff/shipments',
  validate(
    z.object({
      orderNo: z.coerce.number().int().positive().optional(),
      purpose: z.string().trim().max(120).default(''),
      to: toSchema,
      weightKg: z.number().positive().max(50),
      pieces: z.number().int().min(1).max(20).default(1),
      value: z.number().int().min(0).max(1_000_000).default(0),
    }),
  ),
  async (req, res) => {
    const {orderNo, ...rest} = req.body;
    let order = null;
    if (orderNo) {
      order = await Order.findOne({orderNo, status: {$in: LIVE_ORDERS}});
      if (!order) throw notFound('No paid order with that number');
    }
    if (!rest.purpose && !order) throw conflict('NO_PURPOSE', 'Say what is in the parcel, or give its order number');
    const shipment = await Shipment.create({
      ...rest,
      shipmentNo: (await nextSeq('shipment')) + 1000,
      orderId: order ? String(order._id) : undefined,
      orderNo: order?.orderNo,
      userId: order?.userId,
      purpose: rest.purpose || order?.serviceName,
      createdBy: req.user.email,
    });
    const out = await bookShipment(shipment.toObject(), req.user.email);
    audit(req, 'shipment.book', `#${shipment.shipmentNo}`, out.awb ?? out.error);
    res.status(201).json({data: out});
  },
);

async function shipmentOf(req) {
  const s = isId(req.params.id) && (await Shipment.findById(req.params.id));
  if (!s) throw notFound('No such shipment');
  return s;
}

const ORDER_FIELDS = {
  orderNo: 1,
  email: 1,
  product: 1,
  serviceName: 1,
  package: 1,
  quantity: 1,
  amount: 1,
  discount: 1,
  coupon: 1,
  payment: 1,
  timeline: 1,
  createdAt: 1,
};

/** What a parcel's label and invoice print: the parcel, its order (if any) and the pickup address. */
async function printable(shipments) {
  const shipper = shipperOf(await shipSettings());
  const ids = shipments.map((s) => s.orderId).filter(Boolean);
  const [orders, invoices] = ids.length
    ? await Promise.all([
        Order.find({_id: {$in: ids}}, ORDER_FIELDS).lean(),
        Invoice.find({orderId: {$in: ids}}).lean(),
      ])
    : [[], []];
  return shipments.map((s) => {
    const order = orders.find((o) => String(o._id) === s.orderId);
    return {
      shipment: s,
      shipper,
      invoice: invoices.find((i) => i.orderId === s.orderId) ?? null,
      order: order && {
        ...order,
        timeline: undefined,
        payment: order.payment && {method: order.payment.method, razorpayPaymentId: order.payment.razorpayPaymentId},
        productName: getProduct(order.product)?.name,
        paidAt: order.timeline?.find((t) => t.status === 'paid')?.at,
      },
    };
  });
}

/** Several parcels to print in one go (`?ids=a,b,c`, up to 50), in the order asked. */
shipmentRoutes.get('/staff/shipments/print', async (req, res) => {
  const ids = String(req.query.ids ?? '')
    .split(',')
    .filter(isId)
    .slice(0, 50);
  const found = await Shipment.find({_id: {$in: ids}}).lean();
  const ordered = ids.map((id) => found.find((s) => String(s._id) === id)).filter(Boolean);
  res.json({data: await printable(ordered)});
});

/** Marks parcels as printed, so the list shows which labels are already on a box. */
shipmentRoutes.post(
  '/staff/shipments/printed',
  validate(z.object({ids: z.array(z.string().refine(isId)).min(1).max(50)})),
  async (req, res) => {
    const done = await Shipment.updateMany(
      {_id: {$in: req.body.ids}},
      {$set: {printedAt: new Date()}, $inc: {prints: 1}},
    );
    audit(req, 'shipment.print', `${req.body.ids.length} parcels`);
    res.json({data: {printed: done.modifiedCount}});
  },
);

/** One parcel with what its label and invoice print. */
shipmentRoutes.get('/staff/shipments/:id', async (req, res) => {
  const s = await shipmentOf(req);
  res.json({data: (await printable([s.toObject()]))[0]});
});

/** Fixes a parcel before it is booked (the address the automatic check held back, its weight). */
shipmentRoutes.patch(
  '/staff/shipments/:id',
  validate(z.object({to: toSchema, weightKg: z.number().positive().max(50)})),
  async (req, res) => {
    const s = await shipmentOf(req);
    const done = await Shipment.findOneAndUpdate(
      {_id: s._id, awb: {$exists: false}, status: 'created'},
      {$set: {to: req.body.to, weightKg: req.body.weightKg}, $unset: {review: 1}},
      {new: true},
    );
    if (!done) throw conflict('BOOKED', 'A booked parcel cannot be changed');
    audit(req, 'shipment.edit', `#${s.shipmentNo}`, req.body.to.pincode);
    res.json({data: done});
  },
);

/** Books a parcel that has no waybill yet: one the check held back, or one Blue Dart refused. */
shipmentRoutes.post('/staff/shipments/:id/book', async (req, res) => {
  const s = await shipmentOf(req);
  if (s.awb) throw conflict('BOOKED', 'This parcel already has a waybill');
  if (s.status !== 'created') throw conflict('CANCELLED', 'This parcel was cancelled');
  const out = await bookShipment(s.toObject(), req.user.email);
  audit(req, 'shipment.book', `#${s.shipmentNo}`, out.awb ?? out.error);
  res.json({data: out});
});

/** Asks Blue Dart where a parcel is now. */
shipmentRoutes.post('/staff/shipments/:id/track', async (req, res) => {
  const s = await shipmentOf(req);
  if (!s.awb) throw conflict('NOT_BOOKED', 'Book it with Blue Dart first');
  res.json({data: await trackOne(s)});
});

/** Cancels a parcel not yet moving; a booked one is cancelled with Blue Dart by phone first. */
shipmentRoutes.post('/staff/shipments/:id/cancel', async (req, res) => {
  const s = await shipmentOf(req);
  const done = await Shipment.findOneAndUpdate(
    {_id: s._id, status: {$in: ['created', 'booked']}},
    {$set: {status: 'cancelled'}},
    {new: true},
  );
  if (!done) throw conflict('MOVING', 'This parcel is already on its way');
  audit(req, 'shipment.cancel', `#${s.shipmentNo}`, s.awb ?? '');
  res.json({data: done});
});
