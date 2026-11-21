// A stored file. Only the name, type and size are readable; the bytes are
// sealed with AES-256-GCM (iv + tag + data).
import mongoose from 'mongoose';

export const VaultFile = mongoose.model(
  'VaultFile',
  new mongoose.Schema(
    {
      userId: {type: String, required: true, index: true},
      name: {type: String, required: true, maxlength: 200},
      type: {type: String, default: 'application/octet-stream'},
      size: {type: Number, required: true},
      iv: Buffer,
      tag: Buffer,
      data: Buffer,
    },
    {timestamps: true},
  ),
);

/** Projection for listings: everything except the sealed bytes. */
export const WITHOUT_BYTES = {iv: 0, tag: 0, data: 0};
