// The Bharat ID for Business API, called by businesses' servers with an API key: verify an ID, ask for consent and
// read what the holder allowed, and check that a person is the holder (on Pirento's own page, so the business never
// sees a PIN or a code). Test keys answer from a sandbox. Live calls are paid from the owner's wallet and logged.
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import {Router} from 'express';
import {z} from 'zod';
import {AUTH_METHODS, CONSENT_FIELDS, authMethod, isBharatId} from '@pirento/shared';
import {ApiError, isId, isProduction, notFound, notify, validate} from '@pirento/shared/server';
import {config} from '../config.js';
import {AuthSession} from '../models/AuthSession.js';
import {Consent} from '../models/Consent.js';
import {Identity} from '../models/Identity.js';
import {logAccess} from '../lib/access.js';
import {charge} from '../lib/billing.js';
import {SANDBOX_PERSON, detailsOf, pick, requireApiKey, sandboxStatus} from '../lib/business.js';
import {providerFor} from '../lib/providers.js';
import {publicName} from '../lib/publicName.js';

export const apiRoutes = Router();
apiRoutes.use('/v1', requireApiKey);

const SESSION_MS = 10 * 60_000;
const newId = () => new mongoose.Types.ObjectId();

const idParam = (bid) => {
  if (!isBharatId(bid)) throw new ApiError(400, 'INVALID_ID', 'That is not a valid Bharat ID');
  return bid;
};

/** An issued ID's record. Sandbox: the test IDs are issued, anything else is not found. */
async function issued(req, bharatId) {
  if (req.mode === 'test') return sandboxStatus(bharatId) ? {fullName: SANDBOX_PERSON.name, state: 'Delhi'} : null;
  return Identity.findOne({bharatId, status: 'approved'});
}

/** Whether a Bharat ID is issued, with the holder's first name and last initial and their state. */
apiRoutes.get('/v1/ids/:bid', async (req, res) => {
  const bharatId = idParam(req.params.bid);
  const doc = await issued(req, bharatId);
  if (!doc) throw notFound('No issued Bharat ID with this number');
  await charge(req, 'verify', newId());
  logAccess(req, {bharatId, userId: doc.userId, action: 'verify'});
  res.json({
    data: {
      bharatId,
      issued: true,
      name: publicName(doc.fullName),
      state: doc.state,
      issuedAt: doc.issuedAt ?? null,
      mode: req.mode,
    },
  });
});

const consentView = (c, details) => ({
  id: String(c._id),
  bharatId: c.bharatId,
  status: c.status,
  purpose: c.purpose,
  fields: c.fields,
  reference: c.reference ?? null,
  createdAt: c.createdAt,
  decidedAt: c.decidedAt ?? null,
  mode: c.mode,
  ...(details && {details}),
});

/** Asks the holder to share some details. Only the fields our team allowed this business. */
apiRoutes.post(
  '/v1/consents',
  validate(
    z.object({
      bharatId: z.string(),
      purpose: z.string().trim().min(3).max(200),
      fields: z
        .array(z.enum(Object.keys(CONSENT_FIELDS)))
        .min(1)
        .max(Object.keys(CONSENT_FIELDS).length),
      reference: z.string().trim().max(80).optional(),
    }),
  ),
  async (req, res) => {
    const bharatId = idParam(req.body.bharatId);
    const fields = [...new Set(req.body.fields)];
    const refused = fields.filter((f) => !req.business.fields.includes(f));
    if (refused.length) {
      throw new ApiError(
        403,
        'FIELD_NOT_ALLOWED',
        `Your account may not ask for: ${refused.join(', ')}. Ask our team.`,
      );
    }
    const doc = await issued(req, bharatId);
    if (!doc) throw notFound('No issued Bharat ID with this number');
    const id = newId();
    await charge(req, 'consent', id);
    const sandbox = req.mode === 'test' ? sandboxStatus(bharatId) : null;
    const consent = await Consent.create({
      _id: id,
      businessId: String(req.business._id),
      businessName: req.business.profile?.legalName ?? req.business.request.company,
      mode: req.mode,
      bharatId,
      userId: req.mode === 'live' ? doc.userId : undefined,
      purpose: req.body.purpose,
      fields,
      reference: req.body.reference,
      status: sandbox ?? 'pending',
      decidedAt: sandbox && sandbox !== 'pending' ? new Date() : undefined,
    });
    logAccess(req, {bharatId, userId: consent.userId, action: 'consent.request', fields});
    if (req.mode === 'live') {
      notify(doc.userId, {
        event: 'bharat-id.sharing',
        link: '/bharat-id/dashboard/sharing',
        brand: 'Bharat ID',
        label: 'Sharing request',
        big: consent.businessName.slice(0, 80),
        note: `${consent.businessName} asks to see your ${fields.map((f) => CONSENT_FIELDS[f]).join(', ')}, for: ${consent.purpose}. Open your Bharat ID dashboard to allow or decline it.`,
      });
    }
    res.status(201).json({data: consentView(consent)});
  },
);

/** A consent's status; once allowed, the details it covers (read fresh each time, so a revoke stops them). */
apiRoutes.get('/v1/consents/:id', async (req, res) => {
  const consent =
    isId(req.params.id) &&
    (await Consent.findOne({_id: req.params.id, businessId: String(req.business._id), mode: req.mode}));
  if (!consent) throw notFound('No such consent');
  if (consent.status !== 'approved') return res.json({data: consentView(consent)});
  const details =
    consent.mode === 'test'
      ? SANDBOX_PERSON
      : detailsOf((await Identity.findOne({bharatId: consent.bharatId, status: 'approved'})) ?? {});
  logAccess(req, {bharatId: consent.bharatId, userId: consent.userId, action: 'consent.read', fields: consent.fields});
  res.json({data: consentView(consent, pick(details, consent.fields))});
});

// ── Checking that a person is the holder ─────────────────────────────────

/** The return address must be on the business's own website (or a subdomain), so the link cannot send people elsewhere. */
function returnUrlOk(business, raw) {
  let url;
  let site;
  try {
    url = new URL(raw);
    site = new URL(business.request.website).hostname.replace(/^www\./, '');
  } catch {
    return false;
  }
  const local = !isProduction() && ['localhost', '127.0.0.1'].includes(url.hostname);
  return (url.protocol === 'https:' || local) && (local || url.hostname === site || url.hostname.endsWith(`.${site}`));
}

const sessionView = (s) => ({
  id: String(s._id),
  bharatId: s.bharatId,
  method: s.method,
  level: s.level,
  status: s.status === 'pending' && s.expiresAt < new Date() ? 'expired' : s.status,
  reference: s.reference ?? null,
  expiresAt: s.expiresAt,
  passedAt: s.passedAt ?? null,
  mode: s.mode,
});

/**
 * Starts a check. The answer has a `url` on Pirento: send the person there; they prove it is them with the method,
 * then come back to `returnUrl` with `?session=<id>&status=…`. Read the result with GET /v1/auth/sessions/:id.
 */
apiRoutes.post(
  '/v1/auth/sessions',
  validate(
    z.object({
      bharatId: z.string(),
      method: z.enum(AUTH_METHODS.map((m) => m.id)),
      returnUrl: z.string().max(500),
      reference: z.string().trim().max(80).optional(),
    }),
  ),
  async (req, res) => {
    const bharatId = idParam(req.body.bharatId);
    const method = authMethod(req.body.method);
    if (method.expected) throw new ApiError(501, 'METHOD_NOT_AVAILABLE', `${method.label} is not available yet`);
    if (!req.business.methods.includes(method.id)) {
      throw new ApiError(403, 'METHOD_NOT_ALLOWED', 'Our team has not allowed this method for your account');
    }
    if (method.provider && req.mode === 'live' && !providerFor(method.id)) {
      throw new ApiError(503, 'METHOD_OFF', `${method.label} is not switched on yet`);
    }
    if (!returnUrlOk(req.business, req.body.returnUrl)) {
      throw new ApiError(400, 'BAD_RETURN_URL', 'returnUrl must be an https address on your registered website');
    }
    const doc = await issued(req, bharatId);
    if (!doc) throw notFound('No issued Bharat ID with this number');
    const id = newId();
    await charge(req, method.id, id);
    const token = crypto.randomBytes(24).toString('base64url');
    const session = await AuthSession.create({
      _id: id,
      businessId: String(req.business._id),
      businessName: req.business.profile?.legalName ?? req.business.request.company,
      mode: req.mode,
      bharatId,
      userId: req.mode === 'live' ? doc.userId : undefined,
      method: method.id,
      level: method.level,
      tokenHash: crypto.createHash('sha256').update(token).digest('hex'),
      returnUrl: req.body.returnUrl,
      reference: req.body.reference,
      expiresAt: new Date(Date.now() + SESSION_MS),
    });
    logAccess(req, {bharatId, userId: session.userId, action: 'auth.request', method: method.id});
    res.status(201).json({
      data: {...sessionView(session), url: `${config.siteUrl}/bharat-id/authorize/${session._id}?t=${token}`},
    });
  },
);

apiRoutes.get('/v1/auth/sessions/:id', async (req, res) => {
  const session =
    isId(req.params.id) &&
    (await AuthSession.findOne({_id: req.params.id, businessId: String(req.business._id), mode: req.mode}));
  if (!session) throw notFound('No such session');
  logAccess(req, {bharatId: session.bharatId, userId: session.userId, action: 'auth.read', method: session.method});
  res.json({data: sessionView(session)});
});
