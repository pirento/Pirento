import mongoose from 'mongoose';

// The KYC recording, encrypted with AES-256-GCM (see shared/server/crypto.js).
// Kept apart from Identity so listing applications never loads megabytes of video.
export const KycVideo = mongoose.model(
  'KycVideo',
  new mongoose.Schema(
    {
      userId: {type: String, required: true, unique: true},
      type: {type: String, required: true},
      iv: Buffer,
      tag: Buffer,
      data: Buffer,
    },
    {timestamps: true},
  ),
);
