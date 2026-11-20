import mongoose from 'mongoose';

// A customer asking for their account to be deleted. A superadmin approves or rejects it.
export const DeletionRequest = mongoose.model(
  'DeletionRequest',
  new mongoose.Schema(
    {
      userId: {type: String, required: true, index: true},
      email: {type: String, required: true}, // kept after deletion so the request still reads sensibly
      reason: {type: String, default: '', maxlength: 500},
      status: {type: String, enum: ['requested', 'approved', 'rejected'], default: 'requested', index: true},
      answer: {type: String, maxlength: 300}, // why it was rejected
      decidedBy: String,
      decidedAt: Date,
    },
    {timestamps: true},
  ),
);
