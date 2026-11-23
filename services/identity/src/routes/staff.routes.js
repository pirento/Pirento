// The team's side: review applications with their Digio KYC and signed declaration, decide.
import {Router} from 'express';
import {z} from 'zod';
import {bharatIdFromSeq} from '@pirento/shared';
import {
  ACCESS,
  audit,
  badInput,
  conflict,
  decrypt,
  isId,
  nextSeq,
  notFound,
  notify,
  requireAuth,
  requireRole,
  validate,
} from '@pirento/shared/server';
import {config} from '../config.js';
import {Identity} from '../models/Identity.js';
import {KycVideo} from '../models/KycVideo.js';
import {kycMedia, signedDocument} from '../lib/digio.js';
import {UNSIGN, kycDone, refreshKyc, refreshSign, signed} from '../lib/verification.js';
import {flagsFor, lookalikes} from '../lib/flags.js';

export const staffRoutes = Router();
staffRoutes.use('/staff', requireAuth, requireRole(...ACCESS.identity));

const QUEUES = ['submitted', 'approved', 'rejected', 'suspended'];

staffRoutes.get('/staff/queue', async (req, res) => {
  const status = QUEUES.includes(req.query.status) ? req.query.status : 'submitted';
  res.json({data: await Identity.find({status}).sort({submittedAt: 1}).limit(200)});
});

/** One person's application status, for the admin user page (no form answers). */
/** Warning signs for the reviewer (lib/flags.js): details shared with another person's application. */
staffRoutes.get('/staff/:id/flags', async (req, res) => {
  const doc = isId(req.params.id) && (await Identity.findById(req.params.id).lean());
  if (!doc) throw notFound('Application not found');
  const filter = lookalikes(doc);
  const others = filter
    ? await Identity.find(filter, {userId: 1, status: 1, bharatId: 1, sections: 1}).limit(20).lean()
    : [];
  res.json({data: flagsFor(doc, others)});
});

staffRoutes.get('/staff/user/:userId', async (req, res) => {
  const doc = await Identity.findOne(
    {userId: req.params.userId},
    {status: 1, bharatId: 1, submittedAt: 1, issuedAt: 1, reason: 1},
  );
  res.json({data: doc});
});

const findApp = async (id) => {
  const doc = isId(id) && (await Identity.findById(id));
  if (!doc) throw notFound('Application not found');
  return doc;
};

/** Asks Digio again how the KYC and the signature stand (webhooks can lag, above all in sandbox). */
staffRoutes.post('/staff/:id/refresh', async (req, res) => {
  const doc = await findApp(req.params.id);
  res.json({data: await refreshSign(await refreshKyc(doc))});
});

/** Streams one file of the Digio KYC (the video, a selfie, a document). Only files of this application's steps. */
staffRoutes.get('/staff/:id/media/:fileId', async (req, res) => {
  const doc = await findApp(req.params.id);
  if (!doc.digio?.kycActions?.some((a) => a.fileId === req.params.fileId)) throw notFound('No such file');
  const file = await kycMedia(req.params.fileId);
  res.set({
    'content-type': file.headers.get('content-type') ?? 'application/octet-stream',
    'cache-control': 'no-store',
    'content-disposition': 'inline',
  });
  res.send(Buffer.from(await file.arrayBuffer()));
});

/** The signed, e-stamped declaration. */
staffRoutes.get('/staff/:id/declaration', async (req, res) => {
  const doc = await findApp(req.params.id);
  if (!signed(doc)) throw notFound('The declaration is not signed');
  const file = await signedDocument(doc.digio.docId);
  res.set({'content-type': 'application/pdf', 'cache-control': 'no-store', 'content-disposition': 'inline'});
  res.send(Buffer.from(await file.arrayBuffer()));
});

/** Streams a video recorded on Pirento before KYC moved to Digio. Never cached. */
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
    if (decision === 'approve') {
      const app = await findApp(req.params.id);
      // Older applications carry a video recorded on Pirento; newer ones must have passed Digio's KYC and signed.
      if (!app.kyc?.recordedAt && !(kycDone(app) && signed(app))) {
        throw conflict('NOT_VERIFIED', 'The video KYC is not finished or the declaration is not signed on Digio');
      }
    }

    const set =
      decision === 'approve'
        ? {status: 'approved', bharatId: bharatIdFromSeq(await nextSeq('bharat')), issuedAt: new Date()}
        : {status: 'rejected', reason};
    // Conditional on 'submitted': a second click cannot issue a second ID.
    // A sent-back application is signed again after it is fixed, so the old signature goes.
    const doc = await Identity.findOneAndUpdate(
      {_id: req.params.id, status: 'submitted'},
      {$set: set, ...(decision === 'reject' && {$unset: UNSIGN})},
      {new: true},
    );
    if (!doc) throw conflict('CHANGED', 'This application was already decided');

    // Once the ID is issued the video has done its job: delete it, keep only the facts.
    if (decision === 'approve') {
      await KycVideo.deleteOne({userId: doc.userId});
      doc.set('kyc.deletedAt', new Date());
      await doc.save();
    }
    audit(req, `bharat-id.${decision}`, doc.bharatId ?? String(doc._id), reason);
    notify(doc.userId, {
      brand: 'Bharat ID',
      label: 'Your application',
      big: decision === 'approve' ? doc.bharatId : 'Needs changes',
      note:
        decision === 'approve'
          ? // The PIN itself is never emailed: only how to use it, or where to set it.
            doc.pin?.hash
            ? 'Your Bharat ID is issued. You can now sign in with your Bharat ID, the PIN you set and your date of birth. Open the Bharat ID dashboard to see and download your card.'
            : 'Your Bharat ID is issued. Set your 6-digit PIN in the Bharat ID dashboard (PIN) to sign in with it, and open the dashboard to see your card.'
          : `Our team could not approve it yet: ${reason}. Fix it and submit again from your dashboard.`,
    });
    res.json({data: doc});
  },
);

// Suspending stops every use of an issued ID at once (sign-in, verify, business checks, One and Vault), since
// they all ask for 'approved'; restoring brings it back with the same number.
const HOLD = {suspend: ['approved', 'suspended'], restore: ['suspended', 'approved']};

staffRoutes.patch(
  '/staff/:id/hold',
  validate(z.object({action: z.enum(['suspend', 'restore']), reason: z.string().trim().max(300).default('')})),
  async (req, res) => {
    if (!isId(req.params.id)) throw notFound('Application not found');
    const {action, reason} = req.body;
    if (action === 'suspend' && !reason) throw badInput('Say why the ID is suspended');
    const [from, to] = HOLD[action];
    const doc = await Identity.findOneAndUpdate(
      {_id: req.params.id, status: from},
      action === 'suspend'
        ? {$set: {status: to, suspension: {reason, at: new Date()}}}
        : {$set: {status: to}, $unset: {suspension: 1}},
      {new: true},
    );
    if (!doc) throw conflict('CHANGED', `This ID is not ${from}`);
    audit(req, `bharat-id.${action}`, doc.bharatId, reason);
    notify(doc.userId, {
      brand: 'Bharat ID',
      label: action === 'suspend' ? 'Your Bharat ID is suspended' : 'Your Bharat ID works again',
      big: doc.bharatId,
      note:
        action === 'suspend'
          ? `Our team suspended it: ${reason}. It cannot be used to sign in or be checked until it is restored. Reply to this email or open a support ticket if you think this is wrong.`
          : 'Our team restored it. You can sign in and share it again as before.',
    });
    res.json({data: doc});
  },
);
