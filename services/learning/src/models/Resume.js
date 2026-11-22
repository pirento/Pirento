// A person's resume, one per account, encrypted at rest. Sent with every application they make.
import mongoose from 'mongoose';

export const Resume = mongoose.model(
  'Resume',
  new mongoose.Schema(
    {
      userId: {type: String, required: true, unique: true},
      name: {type: String, required: true, maxlength: 200},
      type: {type: String, maxlength: 100},
      size: Number,
      // AES-256-GCM with LEARNING_FILE_KEY, see shared/server/crypto.js.
      iv: Buffer,
      tag: Buffer,
      data: Buffer,
    },
    {timestamps: true},
  ),
);
