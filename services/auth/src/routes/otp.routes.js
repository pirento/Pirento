// Sign-in by code: with your mobile (texted), your email, or your Bharat ID (the code goes to that ID's email).
import crypto from 'node:crypto';
import {Router} from 'express';
import {z} from 'zod';
import {TERMS_VERSION, getProduct, isBharatId, maskPhone, toPhone} from '@pirento/shared';
import {ApiError, callService, validate} from '@pirento/shared/server';
import {config} from '../config.js';
import {User} from '../models/User.js';
import {LoginLink} from '../models/LoginLink.js';
import {checkCode, maskEmail, phoneKey, sendCode, sendPhoneCode} from '../lib/otp.js';
import {issueSession} from '../lib/session.js';
import {phoneCodesOn} from '../lib/sms.js';

export const otpRoutes = Router();

const email = z.string().trim().toLowerCase().email('Enter a valid email');
const code = z.string().regex(/^\d{6}$/, 'Enter the 6-digit code');
const bharatId = z
  .string()
  .transform((v) => v.replace(/\D/g, ''))
  .refine(isBharatId, 'Enter the 10-digit Bharat ID on your card');

// The email names the site the person came from: "your Pirento Legal sign-in code".
const brandOf = (product) => getProduct(product ?? '')?.name ?? 'Pirento Ecosystem';

otpRoutes.post(
  '/otp/request',
  validate(z.object({email, product: z.string().max(20).optional()})),
  async (req, res) => {
    res.json({data: await sendCode(req.body.email, brandOf(req.body.product))});
  },
);

const noAccount = () =>
  new ApiError(404, 'NO_ACCOUNT', 'No Pirento account uses this yet. Create an account to continue.');

otpRoutes.post(
  '/otp/verify',
  validate(z.object({email, code, acceptTerms: z.literal(true).optional()})),
  async (req, res) => {
    // Check the account first, so a stranger's email does not burn a good code on a refusal.
    const isBootstrap = config.superadminEmails().includes(req.body.email);
    const existing = await User.exists({email: req.body.email});
    // A new account needs the terms accepted; bootstrap superadmins are set up by the operator.
    if (!existing && !isBootstrap && !req.body.acceptTerms) throw noAccount();
    await checkCode(req.body.email, req.body.code);
    const user = await User.findOneAndUpdate(
      {email: req.body.email},
      {
        ...(isBootstrap ? {$set: {role: 'superadmin'}} : {}),
        $setOnInsert: {
          ...(isBootstrap ? {} : {role: 'customer'}),
          termsAcceptedAt: new Date(),
          termsVersion: TERMS_VERSION,
        },
      },
      {upsert: true, new: true},
    );
    await issueSession(res, user);
  },
);

const phone = z
  .string()
  .max(20)
  .transform(
    (v, ctx) =>
      toPhone(v) ?? (ctx.addIssue({code: 'custom', message: 'Enter a 10-digit Indian mobile number'}), z.NEVER),
  );

/** Mobile sign-in is for accounts that already have this number, verified at sign-up. */
otpRoutes.post(
  '/otp/phone/request',
  validate(z.object({phone, product: z.string().max(20).optional()})),
  async (req, res) => {
    if (!(await User.exists({phone: req.body.phone}))) throw noAccount();
    const sent = await sendPhoneCode(req.body.phone, brandOf(req.body.product));
    res.json({data: {...sent, sentTo: maskPhone(req.body.phone)}});
  },
);

otpRoutes.post('/otp/phone/verify', validate(z.object({phone, code})), async (req, res) => {
  const user = await User.findOne({phone: req.body.phone});
  if (!user) throw noAccount();
  await checkCode(phoneKey(req.body.phone), req.body.code);
  await issueSession(res, user);
});

/** The account behind an issued Bharat ID, asked of the identity service. */
async function holderOf(id) {
  const owner = await callService(config.identityUrl, '/internal/owner', {bharatId: id}).catch(() => null);
  const user = owner && (await User.findById(owner.userId));
  // One answer for "no such ID" and "not issued yet", so the form cannot be used to probe IDs.
  if (!user) throw new ApiError(404, 'BHARAT_ID_UNKNOWN', 'No issued Bharat ID has that number');
  return user;
}

otpRoutes.post(
  '/otp/bharat-id/request',
  validate(z.object({bharatId, product: z.string().max(20).optional()})),
  async (req, res) => {
    const user = await holderOf(req.body.bharatId);
    const sent = await sendCode(user.email, brandOf(req.body.product));
    res.json({data: {...sent, sentTo: maskEmail(user.email)}});
  },
);

otpRoutes.post('/otp/bharat-id/verify', validate(z.object({bharatId, code})), async (req, res) => {
  const user = await holderOf(req.body.bharatId);
  await checkCode(user.email, req.body.code);
  await issueSession(res, user);
});

/**
 * Sign-in with Bharat ID, the 6-digit PIN and the date of birth. The identity service checks them and locks the
 * PIN after repeated wrong tries; every failure answers alike. Under /otp so the gateway's sign-in limit covers it.
 */
otpRoutes.post(
  '/otp/bharat-id/pin',
  validate(
    z.object({
      bharatId,
      pin: z.string().regex(/^\d{6}$/, 'Enter your 6-digit PIN'),
      dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Enter your date of birth'),
    }),
  ),
  async (req, res) => {
    const {userId} = await callService(config.identityUrl, '/internal/pin-check', req.body);
    const user = await User.findById(userId);
    if (!user) throw new ApiError(401, 'PIN_WRONG', 'Wrong Bharat ID, PIN or date of birth');
    await issueSession(res, user);
  },
);

/** Signs in with a one-time link from an email or text. Under /otp so the gateway's sign-in limit covers it. */
otpRoutes.post('/otp/link', validate(z.object({token: z.string().min(20).max(100)})), async (req, res) => {
  const link = await LoginLink.findOneAndUpdate(
    {
      tokenHash: crypto.createHash('sha256').update(req.body.token).digest('hex'),
      usedAt: null,
      expiresAt: {$gt: new Date()},
    },
    {$set: {usedAt: new Date()}},
    {new: true},
  );
  const user = link && (await User.findById(link.userId));
  if (!user) throw new ApiError(400, 'LINK_INVALID', 'This link has expired or was already used. Ask for a new one.');
  await issueSession(res, user);
});

/**
 * Buying without an account: checkout asks for a name, email and mobile, and a code proves the person holds one of
 * them: the mobile when texts can be sent, else the email. Only the proven one may open an existing account; a new
 * account is made otherwise (with the mobile only when the mobile was proven, so mobile sign-in works later).
 */
const guest = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(80),
  email,
  phone,
  product: z.string().max(20).optional(),
});
const guestChannel = () => (phoneCodesOn() ? 'phone' : 'email');

otpRoutes.post('/otp/checkout/request', validate(guest), async (req, res) => {
  const {email: mail, phone: mobile, product} = req.body;
  const channel = guestChannel();
  const sent =
    channel === 'phone'
      ? {...(await sendPhoneCode(mobile, brandOf(product))), sentTo: maskPhone(mobile)}
      : {...(await sendCode(mail, brandOf(product))), sentTo: maskEmail(mail)};
  res.json({data: {...sent, channel}});
});

otpRoutes.post(
  '/otp/checkout/verify',
  validate(guest.extend({code, acceptTerms: z.literal(true, {error: 'Accept the terms to continue'})})),
  async (req, res) => {
    const {name, email: mail, phone: mobile} = req.body;
    const channel = guestChannel();
    await checkCode(channel === 'phone' ? phoneKey(mobile) : mail, req.body.code);
    const proven = channel === 'phone' ? {phone: mobile} : {email: mail};
    const other = channel === 'phone' ? {email: mail} : {phone: mobile};

    let user = await User.findOne(proven);
    if (!user) {
      // The detail we did not prove may not open, or be added to, someone else's account.
      if (await User.exists(other)) {
        throw new ApiError(
          409,
          channel === 'phone' ? 'EMAIL_TAKEN' : 'PHONE_TAKEN',
          channel === 'phone'
            ? 'This email already has a Pirento account. Sign in with it to buy.'
            : 'This mobile already has a Pirento account. Sign in with it to buy.',
        );
      }
      try {
        user = await User.create({
          email: mail,
          name,
          ...(channel === 'phone' && {phone: mobile}),
          role: 'customer',
          termsAcceptedAt: new Date(),
          termsVersion: TERMS_VERSION,
        });
      } catch (err) {
        if (err.code === 11000) throw new ApiError(409, 'TAKEN', 'This account was just made. Sign in to buy.');
        throw err;
      }
    }
    if (user.role !== 'customer')
      throw new ApiError(403, 'STAFF', 'Staff accounts cannot buy here. Use a customer account.');
    if (!user.name) {
      user.name = name;
      await user.save();
    }
    await issueSession(res, user);
  },
);
