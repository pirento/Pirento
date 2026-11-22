// Paid live work from across Pirento (the Ecosystem, the Foundation, every product), done by an eligible intern.
// The AI suggests who; staff confirm, review it, and approving pays the intern's wallet once.
import mongoose from 'mongoose';

const person = {_id: false, userId: String, email: String, name: String};

export const Work = mongoose.model(
  'Work',
  new mongoose.Schema(
    {
      title: {type: String, required: true, maxlength: 120},
      brief: {type: String, required: true, maxlength: 4000},
      source: {type: String, required: true, maxlength: 60}, // which part of Pirento it is for
      track: {type: String, default: ''},
      skills: [String],
      pay: {type: Number, required: true, min: 0}, // paise, paid on approval
      due: Date,
      status: {type: String, enum: ['open', 'assigned', 'submitted', 'redo', 'approved'], default: 'open'},
      suggestion: {_id: false, userId: String, name: String, reason: String, by: String, at: Date},
      assignee: person,
      answer: {type: String, default: ''},
      link: {type: String, default: ''},
      submittedAt: Date,
      aiReview: {_id: false, grade: Number, feedback: String, problems: [String], lessonIds: [String]},
      grade: Number,
      feedback: String,
      paid: {type: Boolean, default: false},
      createdBy: String,
      approvedBy: String,
    },
    {timestamps: true},
  ),
);
