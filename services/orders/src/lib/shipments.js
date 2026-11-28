// Blue Dart parcels end to end: the shipping settings, booking a parcel (and writing its waybill on the order),
// making one by itself when a shippable order is paid (Pirento AI checks the address first), following live parcels
// every hour, and the notice the customer gets at each change.
import {SHIPPABLE, editedServicesFor, getProduct} from '@pirento/shared';
import {callService, nextSeq, notify} from '@pirento/shared/server';
import {bluedartOn, config} from '../config.js';
import {Invoice} from '../models/Invoice.js';
import {Order} from '../models/Order.js';
import {LIVE_SHIPMENTS, Shipment} from '../models/Shipment.js';
import {DEFAULT_PARCEL, ShipProduct, ShipSettings} from '../models/ShipSettings.js';
import {bookWaybill, trackWaybill} from './bluedart.js';

export const HOUR = 3_600_000;
export const WORDS = {
  booked: 'Booked with Blue Dart',
  'in-transit': 'On its way',
  delivered: 'Delivered',
  returned: 'Coming back to us',
  failed: 'Delivery attempt failed',
};
const LIVE_ORDERS = ['paid', 'in_progress', 'completed'];
const PINCODE = /^[1-9]\d{5}$/;
const MOBILE = /^[6-9]\d{9}$/;

/** The settings row, made on first read. */
export const shipSettings = () =>
  ShipSettings.findOneAndUpdate({_id: 'main'}, {$setOnInsert: {auto: true}}, {upsert: true, new: true}).lean();

/** Where parcels are picked up: admin's address when filled in, else the BLUEDART_SHIPPER_* defaults. */
export const shipperOf = (settings) => (settings?.shipper?.address ? settings.shipper : config.bluedart.shipper);

/** Every shippable service from the catalogue (admin's own included), each with its parcel settings. */
export async function shippableServices() {
  const edits = await fetch(`${config.catalogUrl}/prices`, {signal: AbortSignal.timeout(10_000)})
    .then((r) => r.json())
    .then((j) => j.data ?? {})
    .catch(() => ({}));
  const rows = await ShipProduct.find().lean();
  return SHIPPABLE.flatMap((product) =>
    editedServicesFor(product, edits).map((s) => ({
      slug: s.slug,
      name: s.name,
      product,
      price: s.price,
      ...DEFAULT_PARCEL,
      ...Object.fromEntries(
        Object.entries(rows.find((r) => r.slug === s.slug) ?? {}).filter(([k]) => k in DEFAULT_PARCEL),
      ),
    })),
  );
}

/** Tells the person a parcel's news: their order's product, or Pirento for a parcel of its own. */
export function tellAbout(s, big) {
  if (!s.userId) return;
  notify(s.userId, {
    brand: s.orderNo ? (getProduct(s.product)?.name ?? 'Pirento') : 'Pirento',
    label: s.orderNo ? `Order #${s.orderNo}` : 'Your parcel',
    big,
    note: `Blue Dart waybill ${s.awb}${s.said ? `: ${s.said}` : ''}.`,
    sms: true,
  });
}

/**
 * Books a saved parcel with Blue Dart. On success the order (if any) shows the waybill and the customer is told;
 * on failure the parcel keeps the reason for the team. Claimed on "no waybill yet", so it books once.
 */
export async function bookShipment(shipment, by = 'system') {
  const settings = await shipSettings();
  let awb;
  try {
    ({awb} = await bookWaybill({...shipment, shipper: shipperOf(settings), ref: `PIR${shipment.shipmentNo}`}));
  } catch (err) {
    await Shipment.updateOne({_id: shipment._id}, {$set: {error: err.message}});
    return {...shipment, error: err.message};
  }
  const done = await Shipment.findOneAndUpdate(
    {_id: shipment._id, awb: {$exists: false}},
    {$set: {awb, status: 'booked', nextCheckAt: new Date(Date.now() + HOUR)}, $unset: {error: 1, review: 1}},
    {new: true},
  ).lean();
  if (!done) return Shipment.findById(shipment._id).lean();
  let product;
  if (done.orderId) {
    const order = await Order.findOneAndUpdate(
      {_id: done.orderId, status: {$in: LIVE_ORDERS}},
      {$set: {fulfilment: {courier: 'Blue Dart', tracking: awb, by, at: new Date()}}},
      {new: true, projection: {product: 1}},
    );
    product = order?.product;
    await Invoice.updateOne({orderId: done.orderId}, {$set: {shipping: {courier: 'Blue Dart', awb}}});
  }
  tellAbout({...done, product}, WORDS.booked);
  return done;
}

/**
 * The address to book and why it should wait, from the customer's answers and Pirento AI's reading of them (null
 * when the AI is off): the AI's cleaned name and address, the PIN code given or the one it found, and its problems
 * plus the plain checks. An empty review means the parcel may book by itself.
 */
/** The address with the delivery state added at its end, unless the customer already wrote it. */
const withState = (address, state) =>
  state && !address.toLowerCase().includes(String(state).toLowerCase()) ? `${address}, ${state}` : address;

export function reviewOf(intake = {}, ai = null) {
  const given = {
    name: String(intake.recipientName ?? '').trim(),
    address: String(intake.address ?? '').trim(),
    pincode: String(intake.pincode ?? '').trim(),
    mobile: String(intake.phone ?? '').trim(),
  };
  const to = {
    name: (ai?.name || given.name).slice(0, 80),
    address: withState(ai?.address || given.address, intake.state).slice(0, 300),
    pincode: PINCODE.test(given.pincode) ? given.pincode : (ai?.pincode ?? ''),
    mobile: given.mobile,
  };
  const review = [...(ai?.problems ?? [])];
  if (!to.name) review.push('No recipient name');
  if (to.address.length < 10) review.push('The address is too short');
  if (!PINCODE.test(to.pincode)) review.push('No valid PIN code');
  if (!MOBILE.test(to.mobile)) review.push('No valid mobile number');
  return {to, review: [...new Set(review)].slice(0, 6)};
}

/** Asks Pirento AI to read the address; without it (off, or no answer) the plain checks decide. */
export async function checkAddress(intake = {}) {
  const input = {
    name: intake.recipientName ?? '',
    address: intake.address ?? '',
    pincode: intake.pincode ?? '',
    mobile: intake.phone ?? '',
    state: intake.state ?? '',
  };
  const ai = await callService(config.aiUrl, '/internal/jobs/shipAddress', {input}, {timeoutMs: 60_000}).catch(
    () => null,
  );
  return reviewOf(intake, ai);
}

/**
 * The parcel for a paid order, made once (a unique index on automatic parcels), when shipping is on for its
 * service. A clean address books at once; one with problems waits in admin → Shipments for the team.
 */
export async function autoShip(order) {
  if (!SHIPPABLE.includes(order.product) || !LIVE_ORDERS.includes(order.status)) return null;
  const settings = await shipSettings();
  if (!settings.auto) return null;
  const row = {...DEFAULT_PARCEL, ...((await ShipProduct.findOne({slug: order.serviceSlug}).lean()) ?? {})};
  if (!row.autoShip) return null;
  if (await Shipment.exists({orderId: String(order._id), auto: true})) return null;
  const {to, review} = await checkAddress(order.intake);
  // Goods worth more than ₹50,000 travel with an e-way bill, which the team makes on the GST portal first.
  if (order.amount > 50_000 * 100) review.push('E-way bill needed: the goods are worth more than ₹50,000');
  const quantity = order.quantity ?? 1;
  let shipment;
  try {
    shipment = (
      await Shipment.create({
        shipmentNo: (await nextSeq('shipment')) + 1000,
        auto: true,
        orderId: String(order._id),
        orderNo: order.orderNo,
        userId: order.userId,
        purpose: order.serviceName,
        to,
        weightKg: Math.round(row.weightKg * quantity * 100) / 100,
        pieces: Math.min(quantity, 20),
        size: {lengthCm: row.lengthCm, breadthCm: row.breadthCm, heightCm: row.heightCm},
        value: Math.round(order.amount / 100),
        review,
        createdBy: 'automatic',
      })
    ).toObject();
  } catch (err) {
    if (err.code === 11000) return null; // another copy made it first
    throw err;
  }
  if (review.length || !bluedartOn()) return shipment;
  return bookShipment(shipment);
}

/** Paid shippable orders of the last week that have no parcel yet (a missed hook, a restart): ship them now. */
export async function sweepOrders(now = new Date()) {
  const orders = await Order.find({
    product: {$in: SHIPPABLE},
    status: {$in: ['paid', 'in_progress']},
    updatedAt: {$gte: new Date(now.getTime() - 7 * 24 * HOUR)},
  })
    .limit(200)
    .lean();
  let made = 0;
  for (const order of orders) {
    if (await autoShip(order).catch((err) => console.error('autoship', order.orderNo, err.message))) made++;
  }
  return made;
}

/** Updates one parcel from Blue Dart, and tells the person when its status changes. */
export async function trackOne(s) {
  const t = await trackWaybill(s.awb);
  if (!t) return s;
  const changed = t.status !== s.status;
  const updated = await Shipment.findByIdAndUpdate(
    s._id,
    {
      $set: {
        status: t.status,
        said: t.said,
        scans: t.scans.slice(0, 50),
        nextCheckAt: LIVE_SHIPMENTS.includes(t.status) ? new Date(Date.now() + 3 * HOUR) : null,
      },
    },
    {new: true},
  );
  if (changed) {
    const order = updated.orderId ? await Order.findById(updated.orderId, {product: 1}) : null;
    tellAbout({...updated.toObject(), product: order?.product}, WORDS[t.status] ?? t.said);
  }
  return updated;
}

/** The tracker: every live parcel whose turn has come, each claimed by moving nextCheckAt so one copy takes it. */
export async function trackShipments(now = new Date()) {
  if (!bluedartOn()) return 0;
  let n = 0;
  for (;;) {
    const s = await Shipment.findOneAndUpdate(
      {status: {$in: LIVE_SHIPMENTS}, awb: {$exists: true}, nextCheckAt: {$lte: now}},
      {$set: {nextCheckAt: new Date(now.getTime() + HOUR)}},
      {new: true},
    );
    if (!s) return n;
    await trackOne(s).catch((err) => console.error('shipment track', s.shipmentNo, err.message));
    n++;
  }
}

export function startShipmentTracker() {
  const run = () => {
    sweepOrders().catch((err) => console.error('shipments sweep', err.message));
    trackShipments().catch((err) => console.error('shipments', err.message));
  };
  setTimeout(run, 60_000).unref();
  setInterval(run, HOUR).unref();
}
