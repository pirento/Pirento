import express, {Router} from 'express';
import {z} from 'zod';
import {ID_SECTIONS, validateSection} from '@pirento/shared';
import {ApiError, badInput, conflict, encrypt, requireAuth, validate} from '@pirento/shared/server';
import {config} from '../config.js';
import {Identity} from '../models/Identity.js';
import {KycVideo} from '../models/KycVideo.js';
import {challengeValid, newChallenge} from '../lib/challenge.js';

// The applicant's side: fill the steps, record the video, submit.
export const applicationRoutes = Router();
applicationRoutes.use(['/me', '/draft', '/kyc', '/submit'], requireAuth);

const EDITABLE = {$in: ['draft', 'rejected']};
const locked = () => conflict('LOCKED', 'Your application is already with our team');

/** The application editable by this person, created on first use. */
async function editable(req) {
  try {
    return await Identity.findOneAndUpdate(
      {userId: req.user.sub, status: EDITABLE},
      {$setOnInsert: {email: req.user.email}},
      {new: true, upsert: true},
    );
  } catch (err) {
    // The upsert hit an existing application that is submitted or approved.
    if (err.code === 11000) throw locked();
    throw err;
  }
}

applicationRoutes.get('/me', async (req, res) => {
  res.json({data: await Identity.findOne({userId: req.user.sub})});
});

/** Saves one step. Only while drafting or after a rejection, never once submitted. */
applicationRoutes.put('/draft/:section', async (req, res) => {
  const {data, error} = validateSection(req.params.section, req.body);
  if (error) throw badInput(error);
  const doc = await editable(req);
  doc.sections = {...doc.sections, [req.params.section]: data};
  await doc.save();
  res.json({data: doc});
});

/**
 * Video KYC, part 1: the code to say on camera. Reuses a fresh one, so
 * reloading the page does not change the code mid-recording.
 */
applicationRoutes.post('/kyc/challenge', async (req, res) => {
  const doc = await editable(req);
  if (!challengeValid(doc.kyc)) {
    doc.set('kyc.challenge', newChallenge());
    doc.set('kyc.challengeAt', new Date());
    await doc.save();
  }
  const expiresAt = new Date(new Date(doc.kyc.challengeAt).getTime() + config.challengeLifeMs);
  res.json({data: {challenge: doc.kyc.challenge, expiresAt}});
});

/** Video KYC, part 2: the recording itself, as raw video bytes. */
applicationRoutes.post(
  '/kyc/video',
  express.raw({type: ['video/webm', 'video/mp4'], limit: config.maxVideoBytes}),
  async (req, res) => {
    if (!Buffer.isBuffer(req.body) || req.body.length < 1000) throw badInput('The recording is empty. Record again.');
    const doc = await editable(req);
    if (!challengeValid(doc.kyc)) {
      throw new ApiError(400, 'CHALLENGE_EXPIRED', 'Your code has expired. Get a new code and record again.');
    }
    const type = req.headers['content-type'].split(';')[0];
    await KycVideo.findOneAndUpdate(
      {userId: req.user.sub},
      {type, ...encrypt(config.kycKey, req.body)},
      {upsert: true, new: true},
    );
    doc.set('kyc.recordedAt', new Date());
    doc.set('kyc.size', req.body.length);
    doc.set('kyc.mimeType', type);
    doc.set('kyc.deletedAt', undefined);
    await doc.save();
    res.status(201).json({data: doc});
  },
);

applicationRoutes.post(
  '/submit',
  validate(z.object({consent: z.literal(true, {message: 'Tick the box to agree'})})),
  async (req, res) => {
    const doc = await Identity.findOne({userId: req.user.sub, status: EDITABLE});
    if (!doc) throw conflict('LOCKED', 'There is nothing to submit');
    const missing = ID_SECTIONS.find((s) => !doc.sections?.[s.id]);
    if (missing) throw new ApiError(400, 'INCOMPLETE', `Finish the "${missing.title}" step first`);
    if (!doc.kyc?.recordedAt) throw new ApiError(400, 'INCOMPLETE', 'Record your video verification first');

    const submitted = await Identity.findOneAndUpdate(
      {_id: doc._id, status: doc.status},
      {
        $set: {
          status: 'submitted',
          submittedAt: new Date(),
          consentAt: new Date(),
          fullName: doc.sections.personal.fullName,
          state: doc.sections.address.state,
        },
        $unset: {reason: 1},
      },
      {new: true},
    );
    if (!submitted) throw conflict('CHANGED', 'Your application changed. Reload and try again.');
    res.json({data: submitted});
  },
);
