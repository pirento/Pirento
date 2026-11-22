// One sitting of the final exam. The question order is fixed at the start, and
// only the first submit counts.
import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId: {type: String, required: true, index: true},
  track: {type: String, required: true},
  fullName: {type: String, required: true}, // the name printed on the certificate
  questionIds: [String],
  // The track's rules when it started, so an admin edit never changes a running exam.
  minutes: Number,
  passPercent: Number,
  startedAt: {type: Date, default: Date.now},
  submittedAt: Date,
  percent: Number,
  passed: Boolean,
  // Set while the attempt is running; unset when it is submitted or closed after time ran out.
  open: {type: Boolean, default: true},
});
// One running attempt per person and track, kept by the database: two quick "start"s get the same one.
schema.index({userId: 1, track: 1}, {name: 'one_open_attempt', unique: true, partialFilterExpression: {open: true}});

export const Attempt = mongoose.model('Attempt', schema);
