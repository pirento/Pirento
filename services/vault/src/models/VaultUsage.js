// Bytes each person keeps in the vault, so the quota is taken and given back in single atomic updates.
import mongoose from 'mongoose';

export const VaultUsage = mongoose.model(
  'VaultUsage',
  new mongoose.Schema({userId: {type: String, required: true, unique: true}, used: {type: Number, default: 0}}),
);
