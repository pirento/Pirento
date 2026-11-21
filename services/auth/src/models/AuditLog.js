// The audit trail: one row per staff action in any service (role changes,
// order moves, ID decisions, ticket replies). Written, never edited.
import mongoose from 'mongoose';

export const AuditLog = mongoose.model(
  'AuditLog',
  new mongoose.Schema(
    {
      actorId: {type: String, required: true, index: true},
      actorEmail: {type: String, required: true},
      action: {type: String, required: true, maxlength: 60},
      target: {type: String, required: true, maxlength: 80},
      detail: {type: String, default: '', maxlength: 300},
    },
    {timestamps: {createdAt: true, updatedAt: false}},
  ),
);
