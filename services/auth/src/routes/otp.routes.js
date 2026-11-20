// Sign-in by emailed code: with your email, or with your Bharat ID (the code goes to that ID's email).
import {Router} from 'express';
import {z} from 'zod';
import {getProduct, isBharatId} from '@pirento/shared';
import {ApiError, callService, validate} from '@pirento/shared/server';
import {config} from '../config.js';
import {User} from '../models/User.js';
import {checkCode, maskEmail, sendCode} from '../lib/otp.js';
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

otpRoutes.post('/otp/verify', validate(z.object({email, code})), async (req, res) => {
  await checkCode(req.body.email, req.body.code);
  // First sign-in creates the account. Bootstrap emails are always superadmin.
  const isBootstrap = config.superadminEmails().includes(req.body.email);
  const user = await User.findOneAndUpdate(
    {email: req.body.email},
    isBootstrap ? {$set: {role: 'superadmin'}} : {$setOnInsert: {role: 'customer'}},
    {upsert: true, new: true},
  );
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
