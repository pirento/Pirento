// A Bharat ID for Business API key. Only its SHA-256 is stored; the key itself is shown once, when made.
import mongoose from 'mongoose';

export const ApiKey = mongoose.model(
  'ApiKey',
  new mongoose.Schema(
    {
      businessId: {type: String, required: true, index: true},
      mode: {type: String, enum: ['test', 'live'], required: true},
      hash: {type: String, required: true, unique: true},
      prefix: {type: String, required: true}, // the first characters, so people can tell keys apart
      label: {type: String, default: '', maxlength: 60},
      revokedAt: Date,
      lastUsedAt: Date,
      uses: {type: Number, default: 0},
    },
    {timestamps: true},
  ),
);
