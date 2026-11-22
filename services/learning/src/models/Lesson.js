// A lesson in a track: reading, then a few practice questions. Made in admin; only published ones show.
import mongoose from 'mongoose';

const practice = new mongoose.Schema(
  {question: String, options: [String], answer: Number, explain: {type: String, default: ''}},
  {_id: false},
);

export const Lesson = mongoose.model(
  'Lesson',
  new mongoose.Schema(
    {
      track: {type: String, required: true, index: true},
      order: {type: Number, default: 1},
      title: {type: String, required: true, maxlength: 120},
      body: {type: String, required: true, maxlength: 20000},
      practice: [practice],
      published: {type: Boolean, default: false},
      // A recorded video in S3-compatible storage (lib/video.js); only enrolled interns and staff can play it.
      video: {_id: false, key: String, name: String, size: Number, type: String},
    },
    {timestamps: true},
  ),
);
