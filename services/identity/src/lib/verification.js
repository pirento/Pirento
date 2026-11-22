// Bharat ID verification on Digio: start or resume the video KYC and the declaration eSign, and record their outcome.
import {ApiError, conflict} from '@pirento/shared/server';
import {ID_SECTIONS, declarationSigned, kycDone, kycFailed} from '@pirento/shared';
import {Identity} from '../models/Identity.js';
import {declarationPdf} from './declaration.js';
import {createKyc, createSignRequest, documentStatus, kycResult} from './digio.js';
import {config} from '../config.js';

const DAY = 86_400_000;
const recent = (at) => at && Date.now() - new Date(at).getTime() < DAY;

export {kycDone};
export const signed = declarationSigned;

/** The fields that make up the declaration; editing any of them voids a signature. */
export const UNSIGN = {
  'digio.docId': 1,
  'digio.docToken': 1,
  'digio.docAt': 1,
  'digio.docStatus': 1,
  'digio.signedAt': 1,
  'digio.stamped': 1,
};

function needSections(doc) {
  const missing = ID_SECTIONS.find((s) => !doc.sections?.[s.id]);
  if (missing) throw new ApiError(400, 'INCOMPLETE', `Finish the "${missing.title}" step first`);
}

/**
 * Opens the video KYC: a request made in the last day is resumed, otherwise a new one is made.
 * A finished KYC is kept, unless the team sent the application back (then a new one may be done).
 */
export async function startKyc(doc, write) {
  needSections(doc);
  const d = doc.digio ?? {};
  if (kycDone(doc) && doc.status !== 'rejected') throw conflict('KYC_DONE', 'Your video KYC is already done');
  const resumable = d.kycId && d.kycToken && recent(d.kycAt) && !kycFailed(doc) && !kycDone(doc);
  if (resumable) return {doc, kycId: d.kycId, token: d.kycToken};
  const attempt = (d.kycAttempt ?? 0) + 1;
  const kyc = await createKyc({identity: doc, name: doc.sections.personal.fullName, attempt});
  const saved = await write(doc, {
    'digio.kycId': kyc.id,
    'digio.kycToken': kyc.token,
    'digio.kycAt': new Date(),
    'digio.kycAttempt': attempt,
    'digio.kycStatus': kyc.status || 'requested',
    'digio.kycActions': [],
  });
  return {doc: saved, kycId: kyc.id, token: kyc.token};
}

/**
 * Asks Digio where the KYC stands and records it. Works whatever the application's status.
 * After a webhook only the step list is taken: the webhook's status is newer than a read that may lag it.
 */
export async function refreshKyc(doc, {stepsOnly = false} = {}) {
  if (!doc.digio?.kycId) return doc;
  const r = await kycResult(doc.digio.kycId);
  return Identity.findOneAndUpdate(
    {_id: doc._id, 'digio.kycId': doc.digio.kycId},
    {$set: {'digio.kycActions': r.actions, ...(!stepsOnly && r.status && {'digio.kycStatus': r.status})}},
    {new: true},
  ).then((d) => d ?? doc);
}

/** Opens the declaration for Aadhaar eSign (and e-stamp), after the KYC. Resumes a request from the last day. */
export async function startSign(doc, write) {
  needSections(doc);
  if (!kycDone(doc)) throw new ApiError(400, 'KYC_FIRST', 'Finish your video KYC first');
  const d = doc.digio ?? {};
  if (signed(doc)) throw conflict('SIGNED', 'Your declaration is already signed');
  if (d.docId && d.docToken && d.docStatus === 'requested' && recent(d.docAt)) {
    return {doc, docId: d.docId, token: d.docToken};
  }
  const attempt = (d.signAttempt ?? 0) + 1;
  const r = await createSignRequest({
    identity: doc,
    name: doc.sections.personal.fullName,
    pdf: declarationPdf(doc),
    callback: `BID${doc._id}S${attempt}`,
  });
  const saved = await write(doc, {
    'digio.docId': r.id,
    'digio.docToken': r.token,
    'digio.docAt': new Date(),
    'digio.signAttempt': attempt,
    'digio.docStatus': 'requested',
    'digio.stamped': Boolean(config.digio.estampTag),
  });
  return {doc: saved, docId: r.id, token: r.token};
}

/** Records a finished signature: Digio reports 'completed' once the applicant has signed. */
export async function refreshSign(doc) {
  if (!doc.digio?.docId || signed(doc)) return doc;
  const status = await documentStatus(doc.digio.docId);
  if (status !== 'completed') return doc;
  return markSigned(doc.digio.docId).then((d) => d ?? doc);
}

export const markSigned = (docId) =>
  Identity.findOneAndUpdate(
    {'digio.docId': docId, 'digio.docStatus': {$ne: 'signed'}},
    {$set: {'digio.docStatus': 'signed', 'digio.signedAt': new Date()}},
    {new: true},
  );
