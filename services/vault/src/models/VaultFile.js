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
      label: {type: String, maxlength: 40}, // e.g. PAN, Passport; from the name only (Pirento AI or by hand)
      expiresOn: Date, // the document's own expiry, typed by the owner; a reminder goes 30 days before
      expiryReminded: Date,
      iv: Buffer,
      tag: Buffer,
      data: Buffer,
      blobKey: String, // where the sealed bytes live in the file bucket, when FILES_S3_BUCKET is set
    },
    {timestamps: true},
  ).index({expiresOn: 1, expiryReminded: 1}, {sparse: true}),
);

/** Projection for listings: everything except the sealed bytes. */
export const WITHOUT_BYTES = {iv: 0, tag: 0, data: 0};
