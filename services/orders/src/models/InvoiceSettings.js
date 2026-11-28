// Invoice settings from admin → Invoices → Settings: the registered address printed as the seller's, the number
// prefix, a note for every invoice, and per product its SAC (services) or HSN (goods) code and GST rate. Products are
// listed from the catalogue; a product without a code and rate gets plain invoices until one is set.
import mongoose from 'mongoose';

export const InvoiceSettings = mongoose.model(
  'InvoiceSettings',
  new mongoose.Schema(
    {
      _id: {type: String, default: 'main'},
      address: {type: String, maxlength: 300, default: ''},
      prefix: {type: String, default: 'PIR'},
      note: {type: String, maxlength: 300, default: ''},
      products: {type: Map, of: new mongoose.Schema({code: String, rate: Number}, {_id: false}), default: {}},
      updatedBy: String,
    },
    {timestamps: true},
  ),
);
