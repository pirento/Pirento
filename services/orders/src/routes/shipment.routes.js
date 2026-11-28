// Admin → Shipments: every parcel sent with Blue Dart. Staff book one (for a Giftox order or on its own), Blue Dart
// returns the waybill, and the tracker below follows it until it is delivered or comes back. A Giftox order's
// delivery record gets the waybill, so the customer sees it on their order, and the customer hears each change.
import {Router} from 'express';
import {z} from 'zod';
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
import {Order} from '../models/Order.js';
import {SHIPMENT_STATUSES, Shipment} from '../models/Shipment.js';
import {bookWaybill} from '../lib/bluedart.js';
import {HOUR, WORDS, tellAbout, trackOne} from '../lib/shipments.js';

export const shipmentRoutes = Router();
shipmentRoutes.use('/staff/shipments', requireAuth, requireRole(...ACCESS.shipping));

shipmentRoutes.get('/staff/shipments', async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  const search = /^\d{9,}$/.test(q) ? {awb: q} : searchFilter(q, 'shipmentNo', ['to.name', 'purpose']);
  const status = SHIPMENT_STATUSES.includes(req.query.status) ? {status: req.query.status} : {};
  const [items, counts] = await Promise.all([
    Shipment.find({...status, ...search})
      .sort({createdAt: -1})
      .limit(100),
    Shipment.aggregate([{$group: {_id: '$status', n: {$sum: 1}}}]),
  ]);
  res.json({
    data: {on: bluedartOn(), items, counts: Object.fromEntries(counts.map((c) => [c._id, c.n]))},
  });
});

const PINCODE = /^[1-9]\d{5}$/;
const MOBILE = /^[6-9]\d{9}$/;

/** Books a parcel. With an order number, it is that order's box and goes to the address the customer gave. */
shipmentRoutes.post(
  '/staff/shipments',
  validate(
    z.object({
      orderNo: z.coerce.number().int().positive().optional(),
      purpose: z.string().trim().max(120).default(''),
      to: z.object({
        name: z.string().trim().min(2, 'Who it goes to').max(80),
        address: z.string().trim().min(10, 'Enter the full address').max(300),
        pincode: z.string().regex(PINCODE, 'Enter a 6-digit PIN code'),
        mobile: z.string().regex(MOBILE, 'Enter a 10-digit mobile number'),
      }),
      weightKg: z.number().positive().max(50),
      pieces: z.number().int().min(1).max(20).default(1),
      value: z.number().int().min(0).max(1_000_000).default(0),
    }),
  ),
  async (req, res) => {
    const {orderNo, ...rest} = req.body;
    let order = null;
    if (orderNo) {
      order = await Order.findOne({orderNo, status: {$in: ['paid', 'in_progress', 'completed']}});
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
    try {
      const {awb} = await bookWaybill({...rest, ref: `PIR${shipment.shipmentNo}`});
      shipment.set({awb, status: 'booked', nextCheckAt: new Date(Date.now() + HOUR), error: undefined});
    } catch (err) {
      shipment.set({error: err.message});
    }
    await shipment.save();
    if (shipment.awb) {
      if (order) {
        // The order's delivery record shows the waybill to the customer; only while the order is still live.
        await Order.updateOne(
          {_id: order._id, status: {$in: ['paid', 'in_progress', 'completed']}},
          {$set: {fulfilment: {courier: 'Blue Dart', tracking: shipment.awb, by: req.user.email, at: new Date()}}},
        );
      }
      tellAbout({...shipment.toObject(), product: order?.product}, WORDS.booked);
    }
    audit(req, 'shipment.book', `#${shipment.shipmentNo}`, shipment.awb ?? shipment.error);
    res.status(201).json({data: shipment});
  },
);

async function shipmentOf(req) {
  const s = isId(req.params.id) && (await Shipment.findById(req.params.id));
  if (!s) throw notFound('No such shipment');
  return s;
}

/** Tries the booking again for a parcel Blue Dart refused or did not answer for. */
shipmentRoutes.post('/staff/shipments/:id/book', async (req, res) => {
  const s = await shipmentOf(req);
  if (s.awb) throw conflict('BOOKED', 'This parcel already has a waybill');
  const {awb} = await bookWaybill({...s.toObject(), ref: `PIR${s.shipmentNo}`});
  const done = await Shipment.findOneAndUpdate(
    {_id: s._id, awb: {$exists: false}},
    {$set: {awb, status: 'booked', nextCheckAt: new Date(Date.now() + HOUR)}, $unset: {error: 1}},
    {new: true},
  );
  if (!done) throw conflict('BOOKED', 'This parcel was just booked');
  audit(req, 'shipment.book', `#${s.shipmentNo}`, awb);
  res.json({data: done});
});

/** Asks Blue Dart where a parcel is now. */
shipmentRoutes.post('/staff/shipments/:id/track', async (req, res) => {
  const s = await shipmentOf(req);
  if (!s.awb) throw conflict('NOT_BOOKED', 'Book it with Blue Dart first');
  res.json({data: await trackOne(s)});
});

/** Cancels a parcel Blue Dart never booked; a booked one is cancelled with Blue Dart by phone first. */
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
