// Following Blue Dart parcels: one parcel's latest scans, the hourly pass over every live parcel, and the notice the
// person gets when a status changes.
import {getProduct} from '@pirento/shared';
import {notify} from '@pirento/shared/server';
import {bluedartOn} from '../config.js';
import {Order} from '../models/Order.js';
import {LIVE_SHIPMENTS, Shipment} from '../models/Shipment.js';
import {trackWaybill} from './bluedart.js';

export const HOUR = 3_600_000;
export const WORDS = {
  booked: 'Booked with Blue Dart',
  'in-transit': 'On its way',
  delivered: 'Delivered',
  returned: 'Coming back to us',
  failed: 'Delivery attempt failed',
};

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
  setInterval(() => trackShipments().catch((err) => console.error('shipments', err.message)), HOUR).unref();
}
