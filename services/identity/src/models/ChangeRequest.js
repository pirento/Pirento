// A holder's request to change one step of their issued Bharat ID, waiting for the team.
import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    userId: {type: String, required: true, index: true},
    identityId: {type: String, required: true},
    bharatId: {type: String, required: true},
    section: {type: String, required: true},
    data: {type: Object, required: true}, // already validated and reduced, like the application's own steps
    note: {type: String, default: ''}, // the holder's reason
    status: {type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true},
    reason: String, // why staff turned it down
    decidedBy: {_id: false, id: String, email: String},
    decidedAt: Date,
  },
  {timestamps: true, minimize: false},
);
// One open request per person, so a second one cannot race the first.
schema.index({userId: 1}, {unique: true, partialFilterExpression: {status: 'pending'}, name: 'one_pending'});

export const ChangeRequest = mongoose.model('ChangeRequest', schema);
