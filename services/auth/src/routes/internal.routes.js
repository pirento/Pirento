// Called by other services only: they report staff actions, look up an account, email a notice, and make
// the sign-in for an approved Bharat ID for Business customer.
import {Router} from 'express';
import {z} from 'zod';
import {TERMS_VERSION, toPhone} from '@pirento/shared';
import {conflict, isId, isProduction, requireInternal, validate} from '@pirento/shared/server';
import {AuditLog} from '../models/AuditLog.js';
import {User} from '../models/User.js';
import {sendNoticeEmail} from '../lib/email.js';
import {deliver} from '../lib/notices.js';
import {firstPassword, freeUsername} from '../lib/businessAccount.js';
import {LoginLink} from '../models/LoginLink.js';
import {sendSms} from '../lib/sms.js';
import {config} from '../config.js';
import crypto from 'node:crypto';

import {checkCode, maskEmail, sendKeyedCode} from '../lib/otp.js';
import {phoneCodesOn} from '../lib/sms.js';
import {hashPassword} from '../lib/password.js';

export const internalRoutes = Router();
internalRoutes.use('/internal', requireInternal);

internalRoutes.post(
  '/internal/audit',
  validate(
    z.object({
      actorId: z.string().min(1).max(40),
      actorEmail: z.string().max(200),
      action: z.string().min(1).max(60),
      target: z.string().min(1).max(80),
      detail: z.string().max(300).default(''),
    }),
  ),
  async (req, res) => {
    await AuditLog.create(req.body);
    res.json({data: {ok: true}});
  },
);

/** One account's id, email, role and whether it is suspended; null when there is none. Staff book orders this way. */
internalRoutes.post('/internal/user', validate(z.object({id: z.string().max(40)})), async (req, res) => {
  const user = isId(req.body.id) && (await User.findById(req.body.id));
  res.json({data: user ? {id: String(user._id), email: user.email, role: user.role, suspended: user.suspended} : null});
});

/** A short email to one account: an order moved, the team replied. Suspended and deleted accounts get nothing. */
internalRoutes.post(
  '/internal/notify',
  validate(
    z.object({
      userId: z.string().max(40),
      event: z.string().max(40).default('general'),
      brand: z.string().max(60),
      label: z.string().max(80),
      big: z.string().max(80),
      note: z.string().max(600),
      link: z.string().max(300).default(''),
    }),
  ),
  async (req, res) => {
    const user = isId(req.body.userId) && (await User.findById(req.body.userId));
    const reachable = user && !user.suspended && !user.email.endsWith('.invalid');
    // Answered at once; the channels' speed is not the caller's problem.
    if (reachable) deliver(user, req.body).catch((err) => console.error('notice failed', req.body.event, err.message));
    res.json({data: {sent: Boolean(reachable)}});
  },
);

/** Whose account a mobile is (WhatsApp writes from it): the account it is on, if any. */
internalRoutes.post('/internal/account-by-phone', validate(z.object({phone: z.string().max(20)})), async (req, res) => {
  const phone = toPhone(req.body.phone);
  const user = phone && (await User.findOne({phone, suspended: {$ne: true}}, {email: 1, name: 1, noticePrefs: 1}));
  res.json({
    data: user && {
      userId: String(user._id),
      email: user.email,
      name: user.name,
      whatsapp: Boolean(user.noticePrefs?.whatsapp),
    },
  });
});

/** WhatsApp notices on or off from the chat itself (START / STOP). */
internalRoutes.post(
  '/internal/notice-prefs',
  validate(z.object({userId: z.string().max(40), whatsapp: z.boolean()})),
  async (req, res) => {
    const set = {
      'noticePrefs.whatsapp': req.body.whatsapp,
      ...(req.body.whatsapp && {'noticePrefs.whatsappAt': new Date()}),
    };
    await User.updateOne({_id: req.body.userId}, {$set: set});
    res.json({data: {whatsapp: req.body.whatsapp}});
  },
);

const notice = {
  brand: z.string().max(60),
  label: z.string().max(80),
  big: z.string().max(80),
  note: z.string().max(600),
};

/** A notice to an address with no account yet, e.g. a Bharat ID for Business request that was not approved. */
internalRoutes.post('/internal/notify-email', validate(z.object({email: z.email(), ...notice})), async (req, res) => {
  const {email, ...rest} = req.body;
  await sendNoticeEmail(email, rest);
  res.json({data: {sent: true}});
});

/**
 * The sign-in for an approved Bharat ID for Business customer. A new account gets a user ID and a first
 * password by email, with the sign-in link; someone who already has an account is told to use it.
 * The email is sent before answering: if it fails, the new account is removed so staff can try again.
 */
internalRoutes.post(
  '/internal/business-account',
  validate(
    z.object({
      email: z.email().toLowerCase(),
      name: z.string().max(80),
      company: z.string().max(120),
      loginUrl: z.url(),
      termsAcceptedAt: z.coerce.date(), // accepted on the request form
    }),
  ),
  async (req, res) => {
    const {email, name, company, loginUrl, termsAcceptedAt} = req.body;
    const brand = 'Bharat ID for Business';
    const existing = await User.findOne({email});
    if (existing?.staffId)
      throw conflict('STAFF_EMAIL', 'This email belongs to a staff account; ask for another email');
    if (existing) {
      await sendNoticeEmail(email, {
        brand,
        label: company.slice(0, 80),
        big: 'Approved',
        note: `Your Bharat ID for Business access is approved. Sign in with your existing Pirento account at ${loginUrl}`,
      });
      return res.json({data: {userId: String(existing._id), created: false}});
    }
    const username = await freeUsername(email);
    const password = firstPassword();
    const user = await User.create({
      email,
      name,
      username,
      passwordHash: await hashPassword(password),
      termsAcceptedAt,
      termsVersion: TERMS_VERSION,
    });
    try {
      await sendNoticeEmail(email, {
        brand,
        label: 'Your user ID',
        big: username,
        note: `Your Bharat ID for Business access for ${company} is approved. Your password is ${password} . Sign in at ${loginUrl} with your user ID and password, then change the password on your account page.`,
      });
    } catch (err) {
      await User.deleteOne({_id: user._id});
      throw err;
    }
    // Off production the password comes back too, as sign-in codes do, so tests can sign in.
    res
      .status(201)
      .json({data: {userId: String(user._id), created: true, ...(!isProduction() && {devPassword: password})}});
  },
);

// Codes for a Bharat ID check: one to the account's email, one to its verified mobile, each under its own key.
const codeBody = {
  userId: z.string().max(40),
  purpose: z.string().regex(/^[\w-]{6,64}$/),
  channel: z.enum(['email', 'mobile']),
};
const codeKey = ({purpose, channel}) => `check:${purpose}:${channel}`;

internalRoutes.post(
  '/internal/codes/send',
  validate(z.object({...codeBody, brand: z.string().max(60)})),
  async (req, res) => {
    const user = isId(req.body.userId) && (await User.findById(req.body.userId));
    if (!user || user.suspended) throw conflict('NO_ACCOUNT', 'This Bharat ID cannot be checked this way');
    if (req.body.channel === 'mobile') {
      if (!user.phone || !phoneCodesOn()) throw conflict('NO_MOBILE', 'No verified mobile number to send a code to');
      const sent = await sendKeyedCode(codeKey(req.body), {phone: user.phone}, req.body.brand);
      return res.json({data: {...sent, sentTo: `+91 ••••• •${user.phone.slice(-4)}`}});
    }
    const sent = await sendKeyedCode(codeKey(req.body), {email: user.email}, req.body.brand);
    res.json({data: {...sent, sentTo: maskEmail(user.email)}});
  },
);

internalRoutes.post(
  '/internal/codes/check',
  validate(z.object({...codeBody, code: z.string().regex(/^\d{6}$/)})),
  async (req, res) => {
    await checkCode(codeKey(req.body), req.body.code);
    res.json({data: {ok: true}});
  },
);

/** A plain text to any +91 mobile (a Vault release link to a nominee, who may have no account). */
internalRoutes.post(
  '/internal/sms',
  validate(z.object({phone: z.string().regex(/^\+91\d{10}$/), text: z.string().min(1).max(300)})),
  async (req, res) => {
    await sendSms(req.body.phone, req.body.text);
    res.json({data: {sent: true}});
  },
);

/** A code to any +91 mobile, for someone with no Pirento account yet (a Vault nominee). Checked with codes/check. */
internalRoutes.post(
  '/internal/codes/send-to',
  validate(
    z.object({
      purpose: z.string().regex(/^[\w-]{6,64}$/),
      phone: z.string().regex(/^\+91\d{10}$/),
      brand: z.string().max(60),
    }),
  ),
  async (req, res) => {
    if (!phoneCodesOn()) throw conflict('NO_SMS', 'Mobile codes are not set up yet');
    const sent = await sendKeyedCode(
      codeKey({purpose: req.body.purpose, channel: 'mobile'}),
      {phone: req.body.phone},
      req.body.brand,
    );
    res.json({data: {...sent, sentTo: `+91 ••••• •${req.body.phone.slice(-4)}`}});
  },
);

/**
 * The account behind an email, made if there is none, for a Bharat ID a staffer starts for someone. The staffer
 * confirms the person accepted the terms, so a new account records them as every account does.
 */
internalRoutes.post(
  '/internal/account-for',
  validate(z.object({email: z.email().toLowerCase(), name: z.string().max(80).default('')})),
  async (req, res) => {
    const existing = await User.findOne({email: req.body.email});
    if (existing?.staffId) throw conflict('STAFF_EMAIL', 'This email belongs to a staff account');
    if (existing?.suspended) throw conflict('SUSPENDED', 'This account is suspended');
    if (existing) return res.json({data: {userId: String(existing._id), created: false}});
    const user = await User.create({
      email: req.body.email,
      name: req.body.name,
      termsAcceptedAt: new Date(),
      termsVersion: TERMS_VERSION,
    });
    res.status(201).json({data: {userId: String(user._id), created: true}});
  },
);

const LINK_MS = 3 * 86_400_000;

/**
 * A one-time sign-in link to `next`, sent to the account's email and, when given, by SMS to `phone`. Used to carry
 * on work someone has not finished (a Bharat ID application). Off production the link also comes back.
 */
internalRoutes.post(
  '/internal/continue-link',
  validate(
    z.object({
      userId: z.string().max(40),
      phone: z.string().max(20).optional(),
      brand: z.string().max(60),
      label: z.string().max(80),
      note: z.string().max(300),
      next: z.string().regex(/^\/(?!\/)[\w\-/?=&.]*$/, 'An internal path'),
    }),
  ),
  async (req, res) => {
    const user = isId(req.body.userId) && (await User.findById(req.body.userId));
    if (!user || user.suspended || user.email.endsWith('.invalid'))
      throw conflict('NO_ACCOUNT', 'No account to send to');
    const token = crypto.randomBytes(24).toString('base64url');
    await LoginLink.create({
      userId: String(user._id),
      tokenHash: crypto.createHash('sha256').update(token).digest('hex'),
      expiresAt: new Date(Date.now() + LINK_MS),
    });
    const link = `${config.siteUrl}/continue?token=${token}&next=${encodeURIComponent(req.body.next)}`;
    const {brand, label, note} = req.body;
    // Each channel on its own: a failed text never stops the email, and the reverse.
    const [email, sms] = await Promise.allSettled([
      sendNoticeEmail(user.email, {brand, label, big: 'Continue', note: `${note} ${link} (works once, for 3 days)`}),
      req.body.phone ? sendSms(req.body.phone, `${brand}: ${note} ${link}`) : Promise.reject(new Error('no phone')),
    ]);
    res.json({
      data: {
        email: email.status === 'fulfilled' ? maskEmail(user.email) : null,
        sms: sms.status === 'fulfilled' ? `+91 ••••• •${req.body.phone.slice(-4)}` : null,
        ...(!isProduction() && {devLink: link}),
      },
    });
  },
);

/** Who an invoice is made out to: the billing details if set, else the account's name, email and mobile. */
internalRoutes.post('/internal/billing', validate(z.object({userId: z.string().min(1).max(40)})), async (req, res) => {
  const user =
    isId(req.body.userId) && (await User.findById(req.body.userId, {name: 1, email: 1, phone: 1, billing: 1}));
  if (!user) return res.json({data: null});
  const b = user.billing ?? {};
  res.json({
    data: {
      name: b.name || user.name || '',
      email: user.email,
      phone: user.phone ?? '',
      gstin: b.gstin || '',
      address: b.address || '',
      state: b.state || '',
    },
  });
});
