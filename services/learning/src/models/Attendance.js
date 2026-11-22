// An intern joined a live class (counted when they press Join while it runs). One row per person and class.
import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  classId: {type: String, required: true},
  userId: {type: String, required: true, index: true},
  at: {type: Date, default: Date.now},
});
schema.index({classId: 1, userId: 1}, {unique: true});
export const Attendance = mongoose.model('Attendance', schema);
