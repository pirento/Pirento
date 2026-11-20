import mongoose from 'mongoose';

// An internship or job posted by the team on the Pirento Intern site.
export const Opening = mongoose.model(
  'Opening',
  new mongoose.Schema(
    {
      title: {type: String, required: true, maxlength: 100},
      track: {type: String, maxlength: 40}, // matches an exam track when it fits
      kind: {type: String, enum: ['internship', 'job'], default: 'internship'},
      mode: {type: String, enum: ['remote', 'onsite', 'hybrid'], default: 'remote'},
      location: {type: String, default: '', maxlength: 80},
      description: {type: String, required: true, maxlength: 2000},
      open: {type: Boolean, default: true},
      createdBy: String,
    },
    {timestamps: true},
  ),
);
