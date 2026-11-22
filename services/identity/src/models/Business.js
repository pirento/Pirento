// A Bharat ID for Business customer: their request, the company details, and where they are on the way to live keys.
import mongoose from 'mongoose';

// requested → test (approved: account made, test keys) → live_review → live; rejected, suspended or closed on the way.
export const BUSINESS_STATUSES = ['requested', 'rejected', 'test', 'live_review', 'live', 'suspended', 'closed'];

export const Business = mongoose.model(
  'Business',
  new mongoose.Schema(
    {
      status: {type: String, enum: BUSINESS_STATUSES, default: 'requested', index: true},
      request: {type: Object, required: true}, // the public form (BUSINESS_REQUEST), contact included
      // Set while the request is open, so one email has one open request (a unique index, not a read-then-write).
      open: {type: String, unique: true, sparse: true},
      termsAcceptedAt: {type: Date, required: true},
      userId: {type: String, index: true}, // the account made on approval; they sign in with it
      profile: Object, // company details (BUSINESS_PROFILE), filled in the dashboard
      // What our team lets this business do: the ways it may check a holder, and the details it may ask for.
      // Both start empty: nothing is allowed until staff choose, so each business gets only what its work needs.
      methods: {type: [String], default: []},
      fields: {type: [String], default: []},
      reason: String, // why the team said no or sent it back
      approvedAt: Date,
      liveRequestedAt: Date,
      liveAt: Date,
    },
    {timestamps: true},
  ),
);
