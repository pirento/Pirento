// Sign-in by code: with your mobile (texted), your email, or your Bharat ID (the code goes to that ID's email).
import {Router} from 'express';
import {z} from 'zod';
import {TERMS_VERSION, getProduct, isBharatId, maskPhone, toPhone} from '@pirento/shared';
import {ApiError, callService, validate} from '@pirento/shared/server';
import {config} from '../config.js';
import {User} from '../models/User.js';
import {checkCode, maskEmail, phoneKey, sendCode, sendPhoneCode} from '../lib/otp.js';
import {issueSession} from '../lib/session.js';

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
