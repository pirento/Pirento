// A lesson someone finished (every practice question right once). One row per person and lesson.
import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  userId: {type: String, required: true},
  lessonId: {type: String, required: true},
  track: String,
  doneAt: {type: Date, default: Date.now},
});
schema.index({userId: 1, lessonId: 1}, {unique: true});
export const Progress = mongoose.model('Progress', schema);
