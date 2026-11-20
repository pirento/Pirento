// A Bharat ID application, from first draft to an issued ID.
import mongoose from 'mongoose';

export const STATUSES = ['draft', 'submitted', 'approved', 'rejected'];

/**
 * One Bharat ID application per account.
 * draft → submitted → approved | rejected; a rejected one is edited and submitted again.
 */
export const Identity = mongoose.model(
  'Identity',
  new mongoose.Schema(
    {
      userId: {type: String, required: true, unique: true},
      email: {type: String, required: true},
      status: {type: String, enum: STATUSES, default: 'draft', index: true},

      // One entry per step of the form, already validated and reduced
      // (Aadhaar and bank account keep only their last 4 digits).
      sections: {type: Object, default: {}},

      // Video KYC: the code we asked them to say, and facts about the recording.
      // The recording itself lives encrypted in KycVideo.
      kyc: {
        challenge: String,
        challengeAt: Date,
        recordedAt: Date,
        size: Number,
        mimeType: String, // not "type": inside a schema that word would make Mongoose treat kyc as a String
        deletedAt: Date, // set when the video is removed after approval
      },

      fullName: String, // copied on submit, for the public verify page
      state: String,
      consentAt: Date,
      submittedAt: Date,
      reason: String, // why staff rejected it
      bharatId: {type: String, unique: true, sparse: true},
      issuedAt: Date,
    },
    {timestamps: true, minimize: false},
  ),
);
