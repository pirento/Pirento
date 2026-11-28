// One parcel Pirento sends with Blue Dart: who it goes to, its waybill (AWB), where it is, and the scans so far.
// A Giftox order's box links to its order; anything else (documents, a kit) stands alone with its purpose.
import mongoose from 'mongoose';

export const SHIPMENT_STATUSES = ['created', 'booked', 'in-transit', 'delivered', 'returned', 'failed', 'cancelled'];
export const LIVE_SHIPMENTS = ['booked', 'in-transit', 'failed']; // still tracked: a failed attempt is tried again

export const Shipment = mongoose.model(
  'Shipment',
  new mongoose.Schema(
    {
      shipmentNo: {type: Number, required: true, unique: true},
      orderId: String, // indexed below
      orderNo: Number,
      userId: {type: String, index: true}, // who hears about it
      purpose: {type: String, maxlength: 120},
      to: {
        name: {type: String, maxlength: 80},
        address: {type: String, maxlength: 300},
        pincode: String,
        mobile: String,
      },
      weightKg: Number,
      pieces: {type: Number, default: 1},
      size: {lengthCm: Number, breadthCm: Number, heightCm: Number},
      auto: Boolean, // made by itself when its order was paid
      review: [String], // why an automatic parcel waits for the team instead of booking itself
      value: Number, // declared value in rupees
      carrier: {type: String, default: 'bluedart'},
      awb: {type: String, index: true, sparse: true},
      status: {type: String, enum: SHIPMENT_STATUSES, default: 'created'},
      said: String, // Blue Dart's own words for the latest status
      scans: [{_id: false, at: String, text: String, place: String}],
      error: {type: String, maxlength: 200},
      nextCheckAt: Date, // the tracker claims a parcel by moving this forward
      createdBy: String,
    },
    {timestamps: true},
  )
    .index({status: 1, nextCheckAt: 1})
    // One automatic parcel per order, however many times payment, the sweep and a retry ask for it.
    .index({orderId: 1}, {unique: true, partialFilterExpression: {auto: true}}),
);
