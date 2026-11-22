// Called by other services only: they report staff actions, look up an account, email a notice, and make
// the sign-in for an approved Bharat ID for Business customer.
import {Router} from 'express';
import {z} from 'zod';
import {TERMS_VERSION} from '@pirento/shared';
import {conflict, isId, isProduction, requireInternal, validate} from '@pirento/shared/server';
import {AuditLog} from '../models/AuditLog.js';
import {User} from '../models/User.js';
import {sendNoticeEmail} from '../lib/email.js';
import {firstPassword, freeUsername} from '../lib/businessAccount.js';
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
      brand: z.string().max(60),
      label: z.string().max(80),
      big: z.string().max(80),
      note: z.string().max(600),
    }),
  ),
  async (req, res) => {
    const {userId, ...notice} = req.body;
    const user = isId(userId) && (await User.findById(userId));
    const reachable = user && !user.suspended && !user.email.endsWith('.invalid');
    if (reachable) {
      // Answer now; the mail server's speed is not the caller's problem.
      sendNoticeEmail(user.email, notice).catch((err) => console.error('notice email failed', err.message));
    }
    res.json({data: {sent: Boolean(reachable)}});
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
