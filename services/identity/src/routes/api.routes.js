// The Bharat ID for Business API, called by businesses' servers with an API key: verify an ID, ask for consent,
// read a consent and, once the holder allows it, the details they agreed to share. Test keys answer from a sandbox.
import {Router} from 'express';
import {z} from 'zod';
import {CONSENT_FIELDS, isBharatId} from '@pirento/shared';
import {ApiError, isId, notFound, notify, validate} from '@pirento/shared/server';
import {Consent} from '../models/Consent.js';
import {Identity} from '../models/Identity.js';
import {SANDBOX_PERSON, detailsOf, pick, requireApiKey, sandboxStatus} from '../lib/business.js';
import {publicName} from '../lib/publicName.js';

export const apiRoutes = Router();
apiRoutes.use('/v1', requireApiKey);

const idParam = (bid) => {
  if (!isBharatId(bid)) throw new ApiError(400, 'INVALID_ID', 'That is not a valid Bharat ID');
  return bid;
};

/** An issued ID's public facts. Sandbox: the test IDs are issued, anything else is not found. */
async function issued(req, bharatId) {
  if (req.mode === 'test') return sandboxStatus(bharatId) ? {fullName: SANDBOX_PERSON.name, state: 'Delhi'} : null;
  return Identity.findOne({bharatId, status: 'approved'});
}

/** Whether a Bharat ID is issued, with the holder's first name and last initial and their state. */
apiRoutes.get('/v1/ids/:bid', async (req, res) => {
  const bharatId = idParam(req.params.bid);
  const doc = await issued(req, bharatId);
  if (!doc) throw notFound('No issued Bharat ID with this number');
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

const view = (c, details) => ({
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

/** Asks the holder to share some details. Live: they get an email and decide in their Bharat ID dashboard. */
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
    const doc = await issued(req, bharatId);
    if (!doc) throw notFound('No issued Bharat ID with this number');
    const fields = [...new Set(req.body.fields)];
    const sandbox = req.mode === 'test' ? sandboxStatus(bharatId) : null;
    const consent = await Consent.create({
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
    if (req.mode === 'live') {
      notify(doc.userId, {
        brand: 'Bharat ID',
        label: 'Sharing request',
        big: consent.businessName.slice(0, 80),
        note: `${consent.businessName} asks to see your ${fields.map((f) => CONSENT_FIELDS[f]).join(', ')}, for: ${consent.purpose}. Open your Bharat ID dashboard to allow or decline it.`,
      });
    }
    res.status(201).json({data: view(consent)});
  },
);

/** A consent's status; once allowed, the details it covers (read fresh each time, so a revoke stops them). */
apiRoutes.get('/v1/consents/:id', async (req, res) => {
  const consent =
    isId(req.params.id) &&
    (await Consent.findOne({_id: req.params.id, businessId: String(req.business._id), mode: req.mode}));
  if (!consent) throw notFound('No such consent');
  if (consent.status !== 'approved') return res.json({data: view(consent)});
  const details =
    consent.mode === 'test'
      ? SANDBOX_PERSON
      : detailsOf((await Identity.findOne({bharatId: consent.bharatId, status: 'approved'})) ?? {});
  res.json({data: view(consent, pick(details, consent.fields))});
});
