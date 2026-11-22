// A practice task for an enrolled intern: one daily, one weekly and one monthly, written by the AI (or from the
// next lesson when the AI is off). Graded by the AI's review, or by staff. One per person, cadence and period.
import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    userId: {type: String, required: true},
    enrolmentId: {type: String, required: true, index: true},
    cadence: {type: String, enum: ['daily', 'weekly', 'monthly'], required: true},
    period: {type: String, required: true}, // 2026-11-22, 2026-W47, 2026-11
    due: Date,
    title: {type: String, default: 'Preparing your task…'},
    detail: {type: String, default: ''},
    lessonIds: [String],
    by: {type: String, enum: ['ai', 'lesson', 'pending'], default: 'pending'},
    status: {type: String, enum: ['open', 'submitted', 'graded'], default: 'open'},
    answer: {type: String, default: ''},
    link: {type: String, default: ''},
    submittedAt: Date,
    grade: Number,
    feedback: String,
    problems: [String],
    reviewLessonIds: [String], // lessons (and their videos) the review points to
    gradedBy: String, // 'ai' or a staffer's email
  },
  {timestamps: true},
);
schema.index({userId: 1, cadence: 1, period: 1}, {unique: true});
schema.index({status: 1, submittedAt: 1}); // tasks waiting for staff to grade
export const Assignment = mongoose.model('Assignment', schema);
