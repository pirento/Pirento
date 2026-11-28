// A person's legacy plan: their consent, when they were last seen, where a quiet account's case stands, the team's
// calls to the nominee, the verified death certificate, the release to the nominee and the insurance claims helped.
// Never any vault contents: those stay sealed in Record, Credential and VaultFile.
import mongoose from 'mongoose';
import {LEGACY} from '@pirento/shared';

const by = {type: String, maxlength: 40}; // the staffer's user id

export const Legacy = mongoose.model(
  'Legacy',
  new mongoose.Schema(
    {
      userId: {type: String, required: true, unique: true},
      consentAt: {type: Date, required: true},
      lastSeenAt: {type: Date, required: true},
      stage: {type: String, enum: LEGACY.stages, default: 'active'},
      reminders: {type: Number, default: 0}, // check-in reminders sent since last seen
      remindedAt: Date,
      aliveHash: String, // SHA-256 of the "I am here" link in the latest reminder
      calls: [{_id: false, at: Date, by, outcome: String, note: {type: String, maxlength: 500}}],
      certificate: {
        number: {type: String, maxlength: 60},
        issuedBy: {type: String, maxlength: 120},
        date: String,
        method: {type: String, enum: ['manual', 'api-setu']},
        issuer: String, // the API Setu issuer id, for an API Setu check
        txnId: String, // API Setu's transaction id
        pdfHash: String, // SHA-256 of the certificate API Setu returned; the PDF itself is not kept
        read: {name: String, dateOfDeath: String, match: Boolean}, // what Pirento AI read on it
        verifiedBy: by,
        verifiedAt: Date,
      },
      release: {
        tokenHash: String,
        by,
        at: Date,
        expiresAt: Date,
        openedAt: Date,
        nomineeMobile: String, // the nominee's mobile at release, from their Bharat ID
      },
      claims: [
        {
          _id: false,
          recordId: String,
          title: String,
          status: {type: String, enum: ['not-started', 'filed', 'paid', 'refused']},
          note: {type: String, maxlength: 500},
          at: Date,
        },
      ],
      closedAt: Date,
    },
    {timestamps: true},
  )
    .index({stage: 1, lastSeenAt: 1})
    .index({'release.tokenHash': 1}, {sparse: true}),
);
