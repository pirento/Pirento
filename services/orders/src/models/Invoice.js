// One invoice per paid order, fixed when it is issued: seller and buyer as they were, the place of supply, the line
// with its SAC/HSN code and GST rate, and the amounts in paise (taxable, CGST, SGST, IGST). A "tax" invoice has all
// the GST details; a "plain" one was issued before admin set them and says it is not a GST tax invoice. Cancelling
// the order adds a credit note; the invoice itself never changes or goes away, as tax records must be kept.
import mongoose from 'mongoose';

const party = {
  name: String,
  email: String,
  phone: String,
  gstin: String,
  address: String,
  state: String,
  stateCode: String,
  cin: String,
};

export const Invoice = mongoose.model(
  'Invoice',
  new mongoose.Schema(
    {
      invoiceNo: {type: String, required: true, unique: true}, // PIR/26-27/00001
      fy: {type: String, required: true},
      kind: {type: String, enum: ['tax', 'plain'], required: true},
      orderId: {type: String, required: true, unique: true},
      orderNo: Number,
      userId: {type: String, index: true},
      product: String,
      issuedAt: {type: Date, required: true},
      seller: party,
      buyer: party,
      shipTo: party, // goods only: the delivery address
      placeOfSupply: {state: String, code: String},
      line: {
        description: String,
        codeType: {type: String, enum: ['SAC', 'HSN']},
        code: String,
        qty: Number,
        gross: Number, // before the discount, paise
        discount: Number,
        rate: Number, // GST %
      },
      amounts: {taxable: Number, cgst: Number, sgst: Number, igst: Number, total: Number},
      words: String,
      note: String, // admin's line for every invoice, as it was when issued
      payment: {method: String, ref: String, paidAt: Date},
      shipping: {courier: String, awb: String},
      status: {type: String, enum: ['issued', 'cancelled'], default: 'issued'},
      creditNote: {no: String, at: Date, reason: String},
    },
    {timestamps: true},
  ).index({issuedAt: -1}),
);
