// Someone's place on the programme: bought from their wallet, with their profile, their final mark and the
// programme certificate. One running enrolment per person (a partial unique index).
import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    userId: {type: String, required: true},
    email: String,
    months: {type: Number, required: true},
    paid: Number, // paise, what was debited
    ref: {type: String, required: true, unique: true}, // the wallet ref: one debit, one enrolment
    startsAt: {type: Date, default: Date.now},
    endsAt: {type: Date, required: true},
    status: {type: String, enum: ['active', 'finished'], default: 'active'},
    // What the AI and staff use to set work: the intern fills it in.
    profile: {
      _id: false,
      fullName: String,
      track: String,
      skills: [String],
      education: String,
      goals: String,
      bio: String,
    },
    resume: {_id: false, headline: String, summary: String, bullets: [String], at: Date},
    score: {_id: false, tasks: Number, work: Number, attendance: Number, lessons: Number, total: Number, grade: String},
    certificateCode: String,
    finishedAt: Date,
  },
  {timestamps: true},
);
schema.index({status: 1, updatedAt: -1}); // the matcher's pool and the staff list
schema.index({userId: 1}, {name: 'one_running', unique: true, partialFilterExpression: {status: 'active'}});
export const Enrolment = mongoose.model('Enrolment', schema);
