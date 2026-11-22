// A programme length on sale (3, 6, 9 or 12 months) and its price, set by a superadmin. No row, no sale.
import mongoose from 'mongoose';
import {forgetOnWrite} from '@pirento/shared/server';

const schema = new mongoose.Schema(
  {
    months: {type: Number, required: true, unique: true},
    price: {type: Number, required: true, min: 0}, // paise
    active: {type: Boolean, default: true},
  },
  {timestamps: true},
);
forgetOnWrite(schema, 'learning:programs');
export const Program = mongoose.model('Program', schema);
