// The team's legacy desk (admin → Vault). Staff see where each plan stands and who to call, never what is inside a
// vault. A case moves: call-nominee → nominee-reached (after a call) → verified (death certificate checked by hand;
// API Setu verification is Expected) → released (superadmins only; the nominee gets a link) → closed. A call that
// finds the owner well returns the case to active. After release, staff help the nominee claim each insurance
// policy the owner released, and see only its insurer, policy number and cover to do so.
import crypto from 'node:crypto';
import {Router} from 'express';
import {z} from 'zod';
import {LEGACY} from '@pirento/shared';
import {
  ACCESS,
  audit,
  callService,
  conflict,
  isId,
  notFound,
  requireAuth,
  requireRole,
  validate,
} from '@pirento/shared/server';
import {config} from '../config.js';
import {Legacy} from '../models/Legacy.js';
import {Record} from '../models/Record.js';
import {hashToken} from '../lib/checkin.js';
import {contactsOf} from '../lib/contacts.js';
import {logAction} from '../lib/log.js';
import {openFields} from './record.routes.js';

export const staffRoutes = Router();
staffRoutes.use('/staff', requireAuth, requireRole(...ACCESS.vault));

const RELEASE_DAYS = 30;
const INSURANCE = ['insurance', 'health-insurance'];

staffRoutes.get('/staff/cases', async (req, res) => {
  const stage = LEGACY.stages.includes(req.query.stage) ? req.query.stage : undefined;
  const filter = stage ? {stage} : {stage: {$ne: 'active'}}; // the queue: every case that needs the team
  const [items, counts] = await Promise.all([
    Legacy.find(filter, {userId: 1, stage: 1, lastSeenAt: 1, reminders: 1, remindedAt: 1, consentAt: 1, calls: 1})
      .sort({lastSeenAt: 1})
      .limit(200)
      .lean(),
    Legacy.aggregate([{$group: {_id: '$stage', n: {$sum: 1}}}]),
  ]);
  res.json({
    data: {
      items: items.map(({calls, ...c}) => ({...c, calls: calls?.length ?? 0})),
      counts: Object.fromEntries(counts.map((c) => [c._id, c.n])),
    },
  });
});

async function caseOf(req) {
  const plan = isId(req.params.id) && (await Legacy.findById(req.params.id));
  if (!plan) throw notFound('No such case');
  return plan;
}

/** One case: its plan, who to call (full mobiles, from Bharat ID), and after release the policies to claim. */
staffRoutes.get('/staff/cases/:id', async (req, res) => {
  const plan = await caseOf(req);
  const contacts = await contactsOf(plan.userId);
  const policies =
    plan.stage === 'released' || plan.stage === 'closed'
      ? (await Record.find({userId: plan.userId, release: true, kind: {$in: INSURANCE}})).map((r) => {
          const f = openFields(r);
          return {
            recordId: String(r._id),
            title: r.title,
            kind: r.kind,
            insurer: f.insurer,
            policyNo: f.policyNo,
            cover: f.cover,
          };
        })
      : [];
  await audit(req, 'vault.case.view', String(plan._id));
  const {release, ...rest} = plan.toObject();
  res.json({
    data: {
      ...rest,
      release: release && {at: release.at, expiresAt: release.expiresAt, openedAt: release.openedAt},
      contacts,
      policies,
    },
  });
});

staffRoutes.post(
  '/staff/cases/:id/call',
  validate(
    z.object({outcome: z.enum(['no-answer', 'reached', 'owner-well']), note: z.string().trim().max(500).default('')}),
  ),
  async (req, res) => {
    const plan = await caseOf(req);
    if (!['call-nominee', 'nominee-reached', 'reminding'].includes(plan.stage)) {
      throw conflict('WRONG_STAGE', 'This case is not waiting for a call');
    }
    const call = {at: new Date(), by: req.user.sub, outcome: req.body.outcome, note: req.body.note};
    const set =
      req.body.outcome === 'owner-well'
        ? {stage: 'active', lastSeenAt: new Date(), reminders: 0}
        : req.body.outcome === 'reached'
          ? {stage: 'nominee-reached'}
          : {};
    const done = await Legacy.updateOne({_id: plan._id, stage: plan.stage}, {$push: {calls: call}, $set: set});
    if (!done.modifiedCount) throw conflict('CHANGED', 'This case just changed; reload it');
    await logAction(plan.userId, `call.${req.body.outcome}`, {by: 'staff'});
    await audit(req, `vault.call.${req.body.outcome}`, String(plan._id));
    res.json({data: {stage: set.stage ?? plan.stage}});
  },
);

/** The death certificate, checked by hand against the original (API Setu verification is Expected). */
staffRoutes.post(
  '/staff/cases/:id/certificate',
  validate(
    z.object({
      number: z.string().trim().min(3, 'Enter the certificate number').max(60),
      issuedBy: z.string().trim().min(2, 'Who issued it').max(120),
      date: z.iso.date(),
    }),
  ),
  async (req, res) => {
    const plan = await caseOf(req);
    const certificate = {...req.body, method: 'manual', verifiedBy: req.user.sub, verifiedAt: new Date()};
    const done = await Legacy.updateOne(
      {_id: plan._id, stage: 'nominee-reached'},
      {$set: {stage: 'verified', certificate}},
    );
    if (!done.modifiedCount) throw conflict('WRONG_STAGE', 'Reach the nominee before recording the certificate');
    await logAction(plan.userId, 'certificate.verified', {target: req.body.number, by: 'staff'});
    await audit(req, 'vault.certificate', String(plan._id));
    res.json({data: {stage: 'verified'}});
  },
);

/** Releases the vault to the nominee: a 30-day link, texted to the nominee's mobile from the owner's Bharat ID. */
staffRoutes.post('/staff/cases/:id/release', requireRole(...ACCESS.vaultRelease), async (req, res) => {
  const plan = await caseOf(req);
  const contacts = await contactsOf(plan.userId);
  if (!/^\d{10}$/.test(contacts.nominee.mobile)) throw conflict('NO_NOMINEE', 'The Bharat ID has no nominee mobile');
  const token = crypto.randomBytes(24).toString('base64url');
  const now = new Date();
  const release = {
    tokenHash: hashToken(token),
    by: req.user.sub,
    at: now,
    expiresAt: new Date(now.getTime() + RELEASE_DAYS * 86_400_000),
    nomineeMobile: contacts.nominee.mobile,
  };
  const claims = (await Record.find({userId: plan.userId, release: true, kind: {$in: INSURANCE}}, {title: 1})).map(
    (r) => ({recordId: String(r._id), title: r.title, status: 'not-started', at: now}),
  );
  const done = await Legacy.updateOne({_id: plan._id, stage: 'verified'}, {$set: {stage: 'released', release, claims}});
  if (!done.modifiedCount) throw conflict('WRONG_STAGE', 'Verify the death certificate first');
  const link = `${config.siteUrl}/vault/release/${token}`;
  await callService(config.authUrl, '/internal/sms', {
    phone: `+91${contacts.nominee.mobile}`,
    text: `Pirento Vault: ${contacts.name} named you as nominee. Open what was left for you (a code goes to this mobile): ${link}`,
  }).catch((err) => console.error('release sms', err.message));
  await logAction(plan.userId, 'released', {by: 'staff'});
  await audit(req, 'vault.release', String(plan._id));
  // The link also comes back, so the team can share it on the call if the text does not arrive.
  res.json({data: {stage: 'released', link, expiresAt: release.expiresAt}});
});

/** Insurance claims the team helps the nominee with, one per released policy. */
staffRoutes.patch(
  '/staff/cases/:id/claims/:recordId',
  validate(
    z.object({
      status: z.enum(['not-started', 'filed', 'paid', 'refused']),
      note: z.string().trim().max(500).default(''),
    }),
  ),
  async (req, res) => {
    const plan = await caseOf(req);
    const done = await Legacy.updateOne(
      {_id: plan._id, 'claims.recordId': req.params.recordId},
      {$set: {'claims.$.status': req.body.status, 'claims.$.note': req.body.note, 'claims.$.at': new Date()}},
    );
    if (!done.matchedCount) throw notFound('No such claim');
    await audit(req, `vault.claim.${req.body.status}`, String(plan._id));
    res.json({data: {status: req.body.status}});
  },
);

staffRoutes.post('/staff/cases/:id/close', async (req, res) => {
  const plan = await caseOf(req);
  const done = await Legacy.updateOne(
    {_id: plan._id, stage: 'released'},
    {$set: {stage: 'closed', closedAt: new Date()}},
  );
  if (!done.modifiedCount) throw conflict('WRONG_STAGE', 'Only a released case can be closed');
  await audit(req, 'vault.close', String(plan._id));
  res.json({data: {stage: 'closed'}});
});
