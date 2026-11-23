// A Bharat ID application, from first draft to an issued ID.
import mongoose from 'mongoose';

export const STATUSES = ['draft', 'submitted', 'approved', 'rejected', 'suspended'];

/**
 * One Bharat ID application per account.
 * draft → submitted → approved | rejected; a rejected one is edited and submitted again.
 * Staff can suspend an issued ID (approved ⇄ suspended); every check that wants a live ID asks for 'approved'.
 */
const schema = new mongoose.Schema(
  {
    userId: {type: String, required: true, unique: true},
    email: {type: String, required: true},
    status: {type: String, enum: STATUSES, default: 'draft', index: true},

    // One entry per step of the form, already validated and reduced
    // (Aadhaar and bank account keep only their last 4 digits).
    sections: {type: Object, default: {}},

    // Video KYC recorded on Pirento before it moved to Digio (older applications only).
    // The recording itself lives encrypted in KycVideo.
    kyc: {
      challenge: String,
      challengeAt: Date,
      recordedAt: Date,
      size: Number,
      mimeType: String, // not "type": inside a schema that word would make Mongoose treat kyc as a String
      deletedAt: Date, // set when the video is removed after approval
    },

    // Verification on Digio: the video KYC request (with DigiLocker) and the eSigned, e-stamped declaration.
    digio: {
      kycId: String,
      kycToken: String, // opens the request in Digio's web SDK
      kycAt: Date, // when the request was made; a fresh one is made after a day
      kycAttempt: {type: Number, default: 0},
      kycStatus: String, // Digio's status, lower case (requested, approval_pending, approved, rejected…)
      kycActions: [{_id: false, kind: String, status: String, fileId: String}],
      docId: String,
      docToken: String,
      docAt: Date,
      signAttempt: {type: Number, default: 0},
      docStatus: String, // requested, signed or failed
      signedAt: Date,
      stamped: Boolean,
    },

    // The holder's 6-digit Bharat ID PIN (scrypt), and its lockout after wrong tries.
    pin: {hash: String, setAt: Date, fails: {type: Number, default: 0}, lockedUntil: Date},

    // A staffer who started this application for the person (they finish it themselves, from a link).
    enrolledBy: {_id: false, id: String, email: String},
    // The enrolment centre whose QR started it, if any.
    centre: {_id: false, code: {type: String, index: true}, name: String},
    // Reminders by email and SMS while it is unfinished: how many were sent and when the next one is due.
    reminders: {_id: false, count: {type: Number, default: 0}, nextAt: {type: Date, index: true}},

    fullName: String, // copied on submit, for the public verify page
    state: String,
    consentAt: Date,
    submittedAt: Date,
    reason: String, // why staff rejected it
    bharatId: {type: String, unique: true, sparse: true},
    issuedAt: Date,
    suspension: {_id: false, reason: String, at: Date}, // why and when staff suspended the issued ID
  },
  {
    timestamps: true,
    minimize: false,
    // Digio's SDK tokens skip its first sign-in step: they go only to the applicant, from the start routes.
    toJSON: {
      transform: (_doc, out) => {
        if (out.digio) {
          delete out.digio.kycToken;
          delete out.digio.docToken;
        }
        // Only whether a PIN is set leaves, never its hash.
        out.pinSet = Boolean(out.pin?.hash);
        delete out.pin;
        return out;
      },
    },
  },
);
// The reviewer's warning signs (lib/flags.js) look up the same PAN, mobile or Aadhaar ending on other applications.
schema.index({'sections.documents.pan': 1}, {sparse: true});
schema.index({'sections.contact.mobile': 1}, {sparse: true});
schema.index({'sections.documents.aadhaar': 1}, {sparse: true});

export const Identity = mongoose.model('Identity', schema);
