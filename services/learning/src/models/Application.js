import mongoose from 'mongoose';

// Someone applying to an opening. One application per person per opening.
const schema = new mongoose.Schema(
  {
    openingId: {type: String, required: true, index: true},
    userId: {type: String, required: true},
    email: {type: String, required: true},
    note: {type: String, default: '', maxlength: 1000},
    status: {type: String, enum: ['new', 'shortlisted', 'declined'], default: 'new'},
  },
  {timestamps: true},
);
schema.index({openingId: 1, userId: 1}, {unique: true});
export const Application = mongoose.model('Application', schema);
