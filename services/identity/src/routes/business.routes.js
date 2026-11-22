// Bharat ID for Business, the business's side: ask for access on the public page, then (signed in with the account
// our team made) fill in the company details, ask for live access, make and revoke API keys, see the consent log.
import {Router} from 'express';
import {z} from 'zod';
import {BUSINESS_PROFILE, BUSINESS_REQUEST, validateFields} from '@pirento/shared';
import {ApiError, badInput, conflict, isId, notFound, requireAuth, validate} from '@pirento/shared/server';
import {ApiKey} from '../models/ApiKey.js';
import {Business} from '../models/Business.js';
import {Consent} from '../models/Consent.js';
import {Identity} from '../models/Identity.js';
import {MAY_USE, newKey} from '../lib/business.js';

export const businessRoutes = Router();

/** The public request. No account yet: our team reviews it, then makes one and emails the sign-in. */
businessRoutes.post('/business/requests', async (req, res) => {
  // Bots fill the hidden field; they are told it worked and nothing is kept.
  if (req.body?.website_confirm) return res.status(201).json({data: {received: true}});
  if (req.body?.acceptTerms !== true) throw badInput('Tick the box to accept the terms');
  const {data, error} = validateFields(BUSINESS_REQUEST.fields, req.body);
  if (error) throw badInput(error);
  try {
    await Business.create({request: data, open: data.email, termsAcceptedAt: new Date()});
  } catch (err) {
    if (err.code === 11000) throw conflict('ALREADY_ASKED', 'A request from this email is already with our team');
    throw err;
  }
  res.status(201).json({data: {received: true}});
});

// Everything below is the signed-in business owner.
businessRoutes.use('/business/me', requireAuth);

const mine = async (req) => {
  const b = await Business.findOne({userId: req.user.sub, status: {$nin: ['rejected', 'closed']}}).sort({
    createdAt: -1,
  });
  if (!b) throw notFound('No Bharat ID for Business account is linked to you');
  return b;
};
const ownerIdIssued = (userId) => Identity.exists({userId, status: 'approved'}).then(Boolean);

/** The business, whether the owner's own Bharat ID is issued (needed for live), and usage so far. */
businessRoutes.get('/business/me', async (req, res) => {
  const business = await mine(req);
  const id = String(business._id);
  const [keys, test, live, approved] = await Promise.all([
    ApiKey.find({businessId: id, revokedAt: null}, {hash: 0}).sort({createdAt: -1}),
    Consent.countDocuments({businessId: id, mode: 'test'}),
    Consent.countDocuments({businessId: id, mode: 'live'}),
    Consent.countDocuments({businessId: id, mode: 'live', status: 'approved'}),
  ]);
  res.json({
    data: {
      business,
      ownerIdIssued: await ownerIdIssued(req.user.sub),
      keys,
      usage: {testConsents: test, liveConsents: live, liveApproved: approved},
    },
  });
});

/** Company details; open until live access is asked for, and again if the team sends it back. */
businessRoutes.put('/business/me/profile', async (req, res) => {
  const business = await mine(req);
  const {data, error} = validateFields(BUSINESS_PROFILE.fields, req.body);
  if (error) throw badInput(error);
  const saved = await Business.findOneAndUpdate(
    {_id: business._id, status: 'test'},
    {$set: {profile: data}},
    {new: true},
  );
  if (!saved) throw conflict('LOCKED', 'Your details are with our team or already live');
  res.json({data: saved});
});

/** Asks for live keys: company details filled in and the owner's own Bharat ID issued. */
businessRoutes.post('/business/me/live', async (req, res) => {
  const business = await mine(req);
  if (!business.profile) throw new ApiError(400, 'INCOMPLETE', 'Fill in your company details first');
  if (!(await ownerIdIssued(req.user.sub))) {
    throw new ApiError(
      400,
      'NEEDS_BHARAT_ID',
      'Get your own Bharat ID issued first: the person signing in must be verified',
    );
  }
  const saved = await Business.findOneAndUpdate(
    {_id: business._id, status: 'test'},
    {$set: {status: 'live_review', liveRequestedAt: new Date()}, $unset: {reason: 1}},
    {new: true},
  );
  if (!saved) throw conflict('CHANGED', 'Live access was already asked for');
  res.json({data: saved});
});

/** A new API key, shown once. Test keys from approval on; live keys once live. */
businessRoutes.post(
  '/business/me/keys',
  validate(z.object({mode: z.enum(['test', 'live']), label: z.string().trim().max(60).default('')})),
  async (req, res) => {
    const business = await mine(req);
    if (!MAY_USE[req.body.mode].includes(business.status)) {
      throw new ApiError(
        403,
        'NOT_ALLOWED',
        req.body.mode === 'live'
          ? 'Live keys open once our team approves live access'
          : 'Test keys are not open for this account',
      );
    }
    const {key, hash, prefix} = newKey(req.body.mode);
    const saved = await ApiKey.create({
      businessId: String(business._id),
      mode: req.body.mode,
      hash,
      prefix,
      label: req.body.label,
    });
    res.status(201).json({data: {key, id: String(saved._id), mode: saved.mode, prefix, label: saved.label}});
  },
);

businessRoutes.delete('/business/me/keys/:id', async (req, res) => {
  const business = await mine(req);
  const key =
    isId(req.params.id) &&
    (await ApiKey.findOneAndUpdate(
      {_id: req.params.id, businessId: String(business._id), revokedAt: null},
      {$set: {revokedAt: new Date()}},
      {new: true},
    ));
  if (!key) throw notFound('No such key');
  res.json({data: {revoked: true}});
});

/** The consent log: what was asked, of whom, and how it stands. */
businessRoutes.get('/business/me/consents', async (req, res) => {
  const business = await mine(req);
  const mode = req.query.mode === 'live' ? 'live' : 'test';
  res.json({
    data: await Consent.find({businessId: String(business._id), mode}, {userId: 0})
      .sort({createdAt: -1})
      .limit(200),
  });
});
