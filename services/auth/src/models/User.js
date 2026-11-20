import mongoose from 'mongoose';

export const ROLES = ['customer', 'staff', 'superadmin'];

// One account for the whole ecosystem. Every other service refers to it by _id.
export const User = mongoose.model(
  'User',
  new mongoose.Schema(
    {
      email: {type: String, required: true, unique: true, lowercase: true, trim: true},
      name: {type: String, default: '', maxlength: 80},
      role: {type: String, enum: ROLES, default: 'customer'},
    },
    {timestamps: true},
  ),
);
