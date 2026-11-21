// Wrong-password counts per sign-in key, shared by every auth instance; TTL clears a key a day after its last failure.
import mongoose from 'mongoose';

export const LoginFailure = mongoose.model(
  'LoginFailure',
  new mongoose.Schema({
    key: {type: String, required: true, unique: true},
    count: {type: Number, default: 0},
    notBefore: {type: Number, default: 0}, // epoch ms
    expiresAt: {type: Date, required: true, index: {expires: 0}},
  }),
);
