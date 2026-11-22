// An internship or job on the Pirento Intern site, posted by the team or by an approved company.
import mongoose from 'mongoose';
import {forgetOnWrite} from '@pirento/shared/server';
import {openingDoc, syncDoc} from '../lib/search.js';

const schema = new mongoose.Schema(
  {
    title: {type: String, required: true, maxlength: 100},
    track: {type: String, maxlength: 40}, // matches an exam track when it fits
    kind: {type: String, enum: ['internship', 'job'], default: 'internship'},
    mode: {type: String, enum: ['remote', 'onsite', 'hybrid'], default: 'remote'},
    location: {type: String, default: '', maxlength: 80},
    weeks: {type: Number, min: 1, max: 52}, // how long an internship runs
    stipend: {type: String, default: '', maxlength: 60}, // as written, e.g. "₹10,000 a month" or "Unpaid"
    description: {type: String, required: true, maxlength: 2000},
    open: {type: Boolean, default: true},
    createdBy: String,
    // Set on a company's openings: they stay closed until staff approve them (review: pending → approved).
    employerId: {type: String, index: true},
    company: String,
    review: {type: String, enum: ['pending', 'approved', 'rejected']},
  },
  {timestamps: true},
);
forgetOnWrite(schema, 'learning:openings');
// Kept in the search index (lib/search.js) on every save.
schema.post(['save', 'findOneAndUpdate'], (doc) => doc && syncDoc(doc._id, openingDoc(doc)));
export const Opening = mongoose.model('Opening', schema);
