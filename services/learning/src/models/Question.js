// An exam question written in admin, added to its track's bank. Never deleted, only switched off, so attempts
// that drew it still score.
import mongoose from 'mongoose';

export const Question = mongoose.model(
  'Question',
  new mongoose.Schema(
    {
      track: {type: String, required: true, index: true},
      skill: {type: String, enum: ['theoretical', 'practical'], default: 'theoretical'},
      question: {type: String, required: true, maxlength: 500},
      options: {type: [String], required: true},
      answer: {type: Number, required: true},
      active: {type: Boolean, default: true},
      createdBy: String,
    },
    {timestamps: true},
  ),
);
