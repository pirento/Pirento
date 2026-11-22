// A company that posts internships on Pirento Intern. It asks, staff approve, then its openings go to review.
import mongoose from 'mongoose';

export const Employer = mongoose.model(
  'Employer',
  new mongoose.Schema(
    {
      userId: {type: String, required: true, unique: true}, // the account that runs it
      email: {type: String, required: true},
      company: {type: String, required: true, maxlength: 100},
      website: {type: String, required: true, maxlength: 200},
      about: {type: String, required: true, maxlength: 1500},
      contactName: {type: String, required: true, maxlength: 80},
      phone: {type: String, required: true, maxlength: 15},
      status: {type: String, enum: ['requested', 'approved', 'rejected', 'suspended'], default: 'requested'},
      note: {type: String, default: '', maxlength: 500}, // why, from staff
      decidedBy: String,
    },
    {timestamps: true},
  ),
);
