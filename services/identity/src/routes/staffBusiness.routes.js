// The team's side of Bharat ID for Business: review requests, make the account on approval, open live access.
import {Router} from 'express';
import {z} from 'zod';
import {AUTH_METHODS, CONSENT_FIELDS} from '@pirento/shared';
import {
  ACCESS,
  audit,
  badInput,
  callService,
  conflict,
  isId,
  notFound,
  notify,
  requireAuth,
  requireRole,
  searchFilter,
  validate,
} from '@pirento/shared/server';
import {config} from '../config.js';
import {AccessLog} from '../models/AccessLog.js';
import {ApiKey} from '../models/ApiKey.js';
import {BusinessPricing, PRICED, readPrices} from '../models/BusinessPricing.js';
import {BUSINESS_STATUSES, Business} from '../models/Business.js';

export const staffBusinessRoutes = Router();
staffBusinessRoutes.use('/staff/business', requireAuth, requireRole(...ACCESS.business));

staffBusinessRoutes.get('/staff/business', async (req, res) => {
  const status = BUSINESS_STATUSES.includes(req.query.status) ? req.query.status : 'requested';
  const q = typeof req.query.q === 'string' && req.query.q.trim();
  const filter = (q && searchFilter(q, null, ['request.company', 'request.email', 'profile.legalName'])) || {status};
  res.json({data: await Business.find(filter).sort({createdAt: 1}).limit(200)});
});

// decision → [from statuses, to status]
const MOVES = {
  approve: [['requested'], 'test'],
  reject: [['requested'], 'rejected'],
  live: [['live_review'], 'live'],
  sendBack: [['live_review'], 'test'],
  suspend: [['test', 'live_review', 'live'], 'suspended'],
  restore: [['suspended'], null], // back to live if it was live, else test
};

const tell = (b, big, note) =>
  notify(b.userId, {brand: 'Bharat ID for Business', label: b.request.company.slice(0, 80), big, note});

staffBusinessRoutes.patch(
  '/staff/business/:id',
  validate(z.object({decision: z.enum(Object.keys(MOVES)), reason: z.string().trim().max(300).default('')})),
  async (req, res) => {
    const {decision, reason} = req.body;
    const business = isId(req.params.id) && (await Business.findById(req.params.id));
    if (!business) throw notFound('No such business');
    const [from, target] = MOVES[decision];
    if (!from.includes(business.status))
      throw conflict('CHANGED', `A ${business.status} account cannot be moved this way`);
    if (['reject', 'sendBack', 'suspend'].includes(decision) && !reason) throw badInput('Tell them why');

    const set = {status: target ?? (business.liveAt ? 'live' : 'test')};
    let devPassword;
    const unset = {};
    if (decision === 'approve') {
      // The account first: if it cannot be made or emailed, nothing changes and staff can try again.
      const account = await callService(config.authUrl, '/internal/business-account', {
        email: business.request.email,
        name: business.request.contactName,
        company: business.request.company,
        loginUrl: `${config.siteUrl}/login?next=${encodeURIComponent('/bharat-id/business/dashboard')}`,
        termsAcceptedAt: business.termsAcceptedAt,
      });
      Object.assign(set, {userId: account.userId, approvedAt: new Date()});
      devPassword = account.devPassword; // only off production
    }
    if (decision === 'reject') unset.open = 1; // the same email may ask again later
    if (['reject', 'sendBack', 'suspend'].includes(decision)) set.reason = reason;
    if (decision === 'live') set.liveAt = new Date();
    if (decision === 'live' || decision === 'restore') unset.reason = 1;

    const saved = await Business.findOneAndUpdate(
      {_id: business._id, status: business.status},
      {$set: set, ...(Object.keys(unset).length && {$unset: unset})},
      {new: true},
    );
    if (!saved) throw conflict('CHANGED', 'Someone else just decided this. Reload and try again.');

    audit(req, `business.${decision}`, saved.request.company.slice(0, 80), reason);
    if (decision === 'reject') {
      await callService(config.authUrl, '/internal/notify-email', {
        email: saved.request.email,
        brand: 'Bharat ID for Business',
        label: saved.request.company.slice(0, 80),
        big: 'Not approved',
        note: `We could not approve your request: ${reason}. Reply to this email or write to support@pirento.com if you have questions.`,
      }).catch((err) => console.error('business reject email', err.message));
    }
    if (decision === 'live')
      tell(saved, 'Live access open', 'Your live API keys are open. Make one in your business dashboard.');
    if (decision === 'sendBack')
      tell(saved, 'Needs a change', `Before live access: ${reason}. Fix it in your business dashboard and ask again.`);
    if (decision === 'suspend') tell(saved, 'Suspended', `Your API keys are paused: ${reason}.`);
    if (decision === 'restore') tell(saved, 'Restored', 'Your API keys work again.');
    res.json({data: devPassword ? {...saved.toJSON(), devPassword} : saved});
  },
);

/** A business's keys (never the keys themselves), for staff answering a question about them. */
staffBusinessRoutes.get('/staff/business/:id/keys', async (req, res) => {
  if (!isId(req.params.id)) throw notFound('No such business');
  res.json({data: await ApiKey.find({businessId: req.params.id}, {hash: 0}).sort({createdAt: -1})});
});

/** What a business may do: the check methods and the details it may ask for. Only what its work needs. */
staffBusinessRoutes.patch(
  '/staff/business/:id/access',
  validate(
    z.object({
      methods: z.array(z.enum(AUTH_METHODS.filter((m) => !m.expected).map((m) => m.id))).max(AUTH_METHODS.length),
      fields: z.array(z.enum(Object.keys(CONSENT_FIELDS))).max(Object.keys(CONSENT_FIELDS).length),
    }),
  ),
  async (req, res) => {
    const methods = [...new Set(req.body.methods)];
    const fields = [...new Set(req.body.fields)];
    const saved =
      isId(req.params.id) && (await Business.findByIdAndUpdate(req.params.id, {$set: {methods, fields}}, {new: true}));
    if (!saved) throw notFound('No such business');
    audit(
      req,
      'business.access',
      saved.request.company.slice(0, 80),
      `methods: ${methods.join(', ') || 'none'} · fields: ${fields.join(', ') || 'none'}`,
    );
    res.json({data: saved});
  },
);

/** The access log of one business: every check and read, newest first. */
staffBusinessRoutes.get('/staff/business/:id/log', async (req, res) => {
  if (!isId(req.params.id)) throw notFound('No such business');
  res.json({data: await AccessLog.find({businessId: req.params.id}).sort({createdAt: -1}).limit(300)});
});

/** The price list (paise). Staff see it; only a superadmin changes it. */
staffBusinessRoutes.get('/staff/business/prices', async (_req, res) => res.json({data: await readPrices()}));

staffBusinessRoutes.put(
  '/staff/business/prices',
  requireRole(...ACCESS.catalog),
  validate(z.object(Object.fromEntries(PRICED.map((k) => [k, z.number().int().min(0).max(100_000)])))), // rupees
  async (req, res) => {
    const prices = Object.fromEntries(PRICED.map((k) => [k, req.body[k] * 100]));
    await BusinessPricing.findByIdAndUpdate('prices', {$set: {prices}}, {upsert: true});
    audit(req, 'business.prices', 'Bharat ID for Business', PRICED.map((k) => `${k} ₹${req.body[k]}`).join(' · '));
    res.json({data: await readPrices()});
  },
);
