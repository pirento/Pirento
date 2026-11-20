// A long-lived refresh token, stored only as a hash and deleted on use.
import mongoose from 'mongoose';

export const RefreshToken = mongoose.model(
  'RefreshToken',
  new mongoose.Schema({
    userId: {type: String, required: true, index: true},
    hash: {type: String, required: true, unique: true},
    expiresAt: {type: Date, required: true, index: {expires: 0}},
  }),
);
