import mongoose from 'mongoose';

// support: tickets and users · finance: payments, partners, orders · staff: operations · superadmin: all.
export const ROLES = ['customer', 'support', 'finance', 'staff', 'superadmin'];

// One account for the whole ecosystem. Every other service refers to it by _id.
export const User = mongoose.model(
  'User',
  new mongoose.Schema(
    {
      email: {type: String, required: true, unique: true, lowercase: true, trim: true},
      name: {type: String, default: '', maxlength: 80},
      role: {type: String, enum: ROLES, default: 'customer'},
      // A suspended account cannot sign in or refresh; set by a superadmin.
      suspended: {type: Boolean, default: false},
    },
    {timestamps: true},
  ),
);
