// An account: customer or staff, how they sign in, and which products a staffer works on.
// support: tickets and users · finance: payments, partners, orders · staff: operations · superadmin: all.
import mongoose from 'mongoose';

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
      // Operations staff limited to these product slugs; empty means all products.
      products: {type: [String], default: []},
      // Staff sign in at /admin/login with an issued staff ID and a password (scrypt hash, never sent out).
      staffId: {type: String, unique: true, sparse: true, lowercase: true, trim: true},
      passwordHash: {type: String, select: false},
      // Set the first time someone signs in with Google, so a later email change does not lose the link.
      googleId: {type: String, unique: true, sparse: true},
      // Customers: a verified mobile (+91…), a user ID of their choice (or their email), and when they accepted the terms.
      phone: {type: String, unique: true, sparse: true},
      username: {type: String, unique: true, sparse: true, lowercase: true, trim: true},
      termsAcceptedAt: Date,
      termsVersion: String,
    },
    {
      timestamps: true,
      // Belt and braces: even a document loaded with +passwordHash never serialises it.
      toJSON: {
        transform: (_doc, ret) => {
          // Only whether a password exists goes out (meaningful where the hash was loaded, as /me does).
          ret.hasPassword = Boolean(ret.passwordHash);
          delete ret.passwordHash;
          return ret;
        },
      },
    },
  ),
);
