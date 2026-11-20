import {Router} from 'express';
import {z} from 'zod';
import {bharatIdFromSeq} from '@pirento/shared';
import {
  STAFF,
  badInput,
  conflict,
  decrypt,
  isId,
  nextSeq,
  notFound,
  requireAuth,
  requireRole,
  validate,
} from '@pirento/shared/server';
import {config} from '../config.js';
import {Identity} from '../models/Identity.js';
import {KycVideo} from '../models/KycVideo.js';

// The team's side: review applications, watch the video, decide.
export const staffRoutes = Router();
staffRoutes.use('/staff', requireAuth, requireRole(...STAFF));

const QUEUES = ['submitted', 'approved', 'rejected'];

staffRoutes.get('/staff/queue', async (req, res) => {
  const status = QUEUES.includes(req.query.status) ? req.query.status : 'submitted';
  res.json({data: await Identity.find({status}).sort({submittedAt: 1}).limit(200)});
});

/** Streams the decrypted KYC video for playback. Never cached. */
staffRoutes.get('/staff/:id/video', async (req, res) => {
  const doc = isId(req.params.id) && (await Identity.findById(req.params.id));
  const video = doc && (await KycVideo.findOne({userId: doc.userId}));
  if (!video) throw notFound('No video for this application');
  res.set({'content-type': video.type, 'cache-control': 'no-store', 'content-disposition': 'inline'});
  res.send(decrypt(config.kycKey, video));
});

staffRoutes.patch(
  '/staff/:id',
  validate(z.object({decision: z.enum(['approve', 'reject']), reason: z.string().trim().max(300).default('')})),
  async (req, res) => {
    if (!isId(req.params.id)) throw notFound('Application not found');
    const {decision, reason} = req.body;
    if (decision === 'reject' && !reason) throw badInput('Tell the applicant why');

    const set =
      decision === 'approve'
        ? {status: 'approved', bharatId: bharatIdFromSeq(await nextSeq('bharat')), issuedAt: new Date()}
        : {status: 'rejected', reason};
    // Conditional on 'submitted': a second click cannot issue a second ID.
    const doc = await Identity.findOneAndUpdate({_id: req.params.id, status: 'submitted'}, {$set: set}, {new: true});
    if (!doc) throw conflict('CHANGED', 'This application was already decided');

    // Once the ID is issued the video has done its job: delete it, keep only the facts.
    if (decision === 'approve') {
      await KycVideo.deleteOne({userId: doc.userId});
      doc.set('kyc.deletedAt', new Date());
      await doc.save();
    }
    res.json({data: doc});
  },
);
