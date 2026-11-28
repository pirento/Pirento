// The vault's two doors without a sign-in. "I am here": the link in a check-in reminder. The release: a nominee
// opens what the owner left them with the link our team sent, after a code to the nominee's own mobile (the one in
// the owner's Bharat ID); a release link works for 30 days.
import crypto from 'node:crypto';
import {Router} from 'express';
import {z} from 'zod';
import {ApiError, callService, isId, notFound, openFile, validate} from '@pirento/shared/server';
import {config} from '../config.js';
import {Legacy} from '../models/Legacy.js';
import {VaultFile} from '../models/VaultFile.js';
import {hashToken} from '../lib/checkin.js';
import {contactsOf} from '../lib/contacts.js';
import {logAction} from '../lib/log.js';
import {releasedTo} from '../lib/release.js';

export const publicRoutes = Router();

const token = z.object({token: z.string().min(20).max(80)});

publicRoutes.post('/alive', validate(token), async (req, res) => {
  const now = new Date();
  const plan = await Legacy.findOneAndUpdate(
    {aliveHash: hashToken(req.body.token), stage: {$in: ['active', 'reminding', 'call-nominee', 'nominee-reached']}},
    {$set: {lastSeenAt: now, stage: 'active', reminders: 0}, $unset: {aliveHash: 1, remindedAt: 1}},
  );
  if (!plan) throw notFound('This link has been used or is no longer needed');
  await logAction(plan.userId, 'seen', {target: 'reminder link', by: 'owner'});
  res.json({data: {seen: true}});
});

/** The released plan behind a live release link. */
async function releaseOf(raw) {
  const plan = await Legacy.findOne({
    'release.tokenHash': hashToken(raw),
    stage: 'released',
    'release.expiresAt': {$gt: new Date()},
  });
  if (!plan) throw notFound('This link has expired or is not valid');
  return plan;
}

const purposeOf = (plan) => `vault-release-${plan._id}`;
const BRAND = 'Pirento Vault';

publicRoutes.post('/release/:token/code', async (req, res) => {
  const plan = await releaseOf(req.params.token);
  const sent = await callService(config.authUrl, '/internal/codes/send-to', {
    purpose: purposeOf(plan),
    phone: `+91${plan.release.nomineeMobile}`,
    brand: BRAND,
  });
  res.json({data: sent});
});

// A short-lived note that lets the nominee's browser fetch the released files after the code was checked.
const FILE_MIN = 30 * 60_000;
const sign = (body) =>
  crypto
    .createHmac('sha256', `${config.key.toString('hex')}:vault-release`)
    .update(body)
    .digest('base64url');
const fileToken = (planId) => {
  const body = Buffer.from(JSON.stringify({p: String(planId), until: Date.now() + FILE_MIN})).toString('base64url');
  return `${body}.${sign(body)}`;
};
function fileTokenOk(planId, t) {
  const [body, mac] = String(t ?? '').split('.');
  if (!body || !mac || sign(body) !== mac) return false;
  try {
    const {p, until} = JSON.parse(Buffer.from(body, 'base64url').toString());
    return p === String(planId) && until > Date.now();
  } catch {
    return false;
  }
}

publicRoutes.post(
  '/release/:token/open',
  validate(z.object({code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code')})),
  async (req, res) => {
    const plan = await releaseOf(req.params.token);
    await callService(config.authUrl, '/internal/codes/check', {
      userId: 'nominee',
      purpose: purposeOf(plan),
      channel: 'mobile',
      code: req.body.code,
    });
    const [contacts, items] = await Promise.all([contactsOf(plan.userId), releasedTo(plan.userId)]);
    if (!plan.release.openedAt) await Legacy.updateOne({_id: plan._id}, {$set: {'release.openedAt': new Date()}});
    await logAction(plan.userId, 'release.open', {by: 'nominee'});
    res.set('cache-control', 'no-store').json({
      data: {
        owner: {name: contacts.name, bharatId: contacts.bharatId},
        nominee: {name: contacts.nominee.name, relation: contacts.nominee.relation},
        releasedAt: plan.release.at,
        certificate: {number: plan.certificate.number, date: plan.certificate.date},
        ...items,
        fileToken: fileToken(plan._id),
      },
    });
  },
);

publicRoutes.get('/release/:token/files/:id', async (req, res) => {
  const plan = await releaseOf(req.params.token);
  if (!fileTokenOk(plan._id, req.query.t)) throw new ApiError(403, 'CODE_NEEDED', 'Check the code again to download');
  const file =
    isId(req.params.id) && (await VaultFile.findOne({_id: req.params.id, userId: plan.userId, release: true}));
  if (!file) throw notFound('Not found');
  await logAction(plan.userId, 'release.file', {target: file.name, by: 'nominee'});
  res.set({
    'content-type': 'application/octet-stream',
    'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.name)}`,
    'cache-control': 'no-store',
  });
  res.send(await openFile(config.key, file));
});
