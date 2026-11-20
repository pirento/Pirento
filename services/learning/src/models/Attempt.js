// One sitting of the final exam. The question order is fixed at the start, and
// only the first submit counts.
import mongoose from 'mongoose';

export const Attempt = mongoose.model(
  'Attempt',
  new mongoose.Schema({
    userId: {type: String, required: true, index: true},
    track: {type: String, required: true},
    fullName: {type: String, required: true}, // the name printed on the certificate
    questionIds: [String],
    startedAt: {type: Date, default: Date.now},
    submittedAt: Date,
    percent: Number,
    passed: Boolean,
  }),
);
