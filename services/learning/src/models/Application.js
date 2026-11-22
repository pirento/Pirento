// Someone applying to an opening, and the internship that follows: interview, offer, tasks, completion.
// One application per person per opening.
import mongoose from 'mongoose';
import {APPLICATION_STATUSES} from '../lib/pipeline.js';

const task = new mongoose.Schema(
  {
    title: {type: String, required: true, maxlength: 120},
    detail: {type: String, default: '', maxlength: 2000},
    due: Date,
    status: {type: String, enum: ['open', 'submitted', 'approved', 'redo'], default: 'open'},
    answer: {type: String, default: '', maxlength: 2000}, // what the intern sent
    link: {type: String, default: '', maxlength: 300},
    submittedAt: Date,
    feedback: {type: String, default: '', maxlength: 1000},
  },
  {timestamps: true},
);

const schema = new mongoose.Schema(
  {
    openingId: {type: String, required: true, index: true},
    employerId: {type: String, index: true}, // copied from the opening, so a company sees only its own
    userId: {type: String, required: true, index: true},
    email: {type: String, required: true},
    fullName: {type: String, maxlength: 80}, // printed on the internship certificate
    note: {type: String, default: '', maxlength: 1000},
    links: {type: String, default: '', maxlength: 300}, // portfolio, GitHub, LinkedIn
    status: {type: String, enum: APPLICATION_STATUSES, default: 'new'},
    interview: {_id: false, at: Date, link: String, note: String},
    offer: {_id: false, start: Date, weeks: Number, stipend: String, note: String},
    tasks: [task],
    completedAt: Date,
    certificateCode: String,
    history: [{_id: false, status: String, by: String, at: {type: Date, default: Date.now}}],
  },
  {timestamps: true},
);
schema.index({openingId: 1, userId: 1}, {unique: true});
export const Application = mongoose.model('Application', schema);
