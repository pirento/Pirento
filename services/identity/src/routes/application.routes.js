// The applicant's side: fill the steps, do the video KYC and sign the declaration on Digio, submit.
import {Router} from 'express';
import {ID_SECTIONS, validateSection} from '@pirento/shared';
import {ApiError, badInput, conflict, requireAuth} from '@pirento/shared/server';
import {config, digioOn} from '../config.js';
import {Identity} from '../models/Identity.js';
import {signedDocument} from '../lib/digio.js';
import {remindFromNow} from '../lib/reminders.js';
import {UNSIGN, kycDone, refreshKyc, refreshSign, signed, startKyc, startSign} from '../lib/verification.js';

export const applicationRoutes = Router();
applicationRoutes.use(['/me', '/draft', '/kyc', '/sign', '/declaration', '/submit'], requireAuth);

const EDITABLE = {$in: ['draft', 'rejected']};
const locked = () => conflict('LOCKED', 'Your application is already with our team');

/** The application editable by this person, created on first use. */
async function editable(req) {
  try {
    return await Identity.findOneAndUpdate(
      {userId: req.user.sub, status: EDITABLE},
      {$setOnInsert: {email: req.user.email, ...remindFromNow()}},
      {new: true, upsert: true},
    );
  } catch (err) {
    // The upsert hit an existing application that is submitted or approved.
    if (err.code === 11000) throw locked();
    throw err;
  }
}

/**
 * Writes to an application only while it is still a draft or rejected, in one conditional update, so a
 * save racing a submit can never change what was submitted.
 */
async function stillEditable(doc, set, unset) {
  const saved = await Identity.findOneAndUpdate(
    {_id: doc._id, status: EDITABLE},
    // Every change starts the reminder clock again: reminders follow a stalled application, not a busy one.
    {$set: {...set, ...remindFromNow()}, ...(unset && {$unset: unset})},
    {new: true},
  );
  if (!saved) throw locked();
  return saved;
}

/** What the browser needs to open Digio's web SDK; `on` is false until the account keys are set. */
applicationRoutes.get('/digio/config', (_req, res) => {
  res.json({
    data: {
      on: digioOn(),
      environment: config.digio.environment,
      sdk: config.digio.sdk,
      stamped: Boolean(config.digio.estampTag),
    },
  });
});

applicationRoutes.get('/me', async (req, res) => {
  res.json({data: await Identity.findOne({userId: req.user.sub})});
});

/** Saves one step. Changing the details voids a signed declaration: it no longer matches what was signed. */
applicationRoutes.put('/draft/:section', async (req, res) => {
  const {data, error} = validateSection(req.params.section, req.body);
  if (error) throw badInput(error);
  const doc = await editable(req);
  const same = JSON.stringify(doc.sections?.[req.params.section] ?? null) === JSON.stringify(data);
  res.json({data: await stillEditable(doc, {[`sections.${req.params.section}`]: data}, same ? null : UNSIGN)});
});

/** Video KYC on Digio: returns the request id and token for the web SDK. */
applicationRoutes.post('/kyc/start', async (req, res) => {
  const {doc, kycId, token} = await startKyc(await editable(req), stillEditable);
  res.json({data: {doc, kycId, token, identifier: doc.email}});
});

/** After the SDK closes: asks Digio how the KYC went. */
applicationRoutes.post('/kyc/refresh', async (req, res) => {
  const doc = await Identity.findOne({userId: req.user.sub});
  res.json({data: doc && (await refreshKyc(doc))});
});

/** The declaration, for Aadhaar eSign (with an e-stamp when one is set up): request id and token for the SDK. */
applicationRoutes.post('/sign/start', async (req, res) => {
  const {doc, docId, token} = await startSign(await editable(req), stillEditable);
  res.json({data: {doc, docId, token, identifier: doc.email}});
});

applicationRoutes.post('/sign/refresh', async (req, res) => {
  const doc = await Identity.findOne({userId: req.user.sub});
  res.json({data: doc && (await refreshSign(doc))});
});

/** The signed declaration, straight from Digio. */
applicationRoutes.get('/declaration', async (req, res) => {
  const doc = await Identity.findOne({userId: req.user.sub});
  if (!doc || !signed(doc)) throw new ApiError(404, 'NOT_SIGNED', 'Your declaration is not signed yet');
  const file = await signedDocument(doc.digio.docId);
  res.set({
    'content-type': 'application/pdf',
    'content-disposition': 'attachment; filename="Bharat-ID-declaration.pdf"',
    'cache-control': 'no-store',
  });
  res.send(Buffer.from(await file.arrayBuffer()));
});

/** Sends the application to the team: every step, a finished video KYC, a signed declaration and a PIN. */
applicationRoutes.post('/submit', async (req, res) => {
  const doc = await Identity.findOne({userId: req.user.sub, status: EDITABLE});
  if (!doc) throw conflict('LOCKED', 'There is nothing to submit');
  const missing = ID_SECTIONS.find((s) => !doc.sections?.[s.id]);
  if (missing) throw new ApiError(400, 'INCOMPLETE', `Finish the "${missing.title}" step first`);
  if (!kycDone(doc)) throw new ApiError(400, 'INCOMPLETE', 'Finish your video KYC first');
  if (!signed(doc)) throw new ApiError(400, 'INCOMPLETE', 'Sign your declaration first');
  if (!doc.pin?.hash) throw new ApiError(400, 'INCOMPLETE', 'Set your 6-digit PIN first');

  const submitted = await Identity.findOneAndUpdate(
    {_id: doc._id, status: doc.status, 'digio.docStatus': 'signed'},
    {
      $set: {
        status: 'submitted',
        submittedAt: new Date(),
        consentAt: doc.digio.signedAt, // signing the declaration is the consent
        fullName: doc.sections.personal.fullName,
        state: doc.sections.address.state,
      },
      $unset: {reason: 1},
    },
    {new: true},
  );
  if (!submitted) throw conflict('CHANGED', 'Your application changed. Reload and try again.');
  res.json({data: submitted});
});
