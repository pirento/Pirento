import crypto from 'node:crypto';
import {Router} from 'express';
import {z} from 'zod';
import {getProduct} from '@pirento/shared';
import {ApiError, validate} from '@pirento/shared/server';
import {config} from '../config.js';
import {Otp} from '../models/Otp.js';
import {User} from '../models/User.js';
import {mailer, sendOtpEmail} from '../lib/email.js';
import {issueSession, sha256} from '../lib/session.js';

// Sign-in by email code: ask for a code, then trade it for a session.
export const otpRoutes = Router();

const email = z.string().trim().toLowerCase().email('Enter a valid email');

otpRoutes.post(
  '/otp/request',
  validate(z.object({email, product: z.string().max(20).optional()})),
  async (req, res) => {
    // Without a mail server, production would accept emails and never deliver a code.
    if (config.isProduction && !mailer()) {
      throw new ApiError(503, 'EMAIL_UNAVAILABLE', 'Email sign-in is not set up yet');
    }

    // One code per 30 seconds per email keeps the inbox (and the SMTP bill) sane.
    const last = await Otp.findOne({email: req.body.email}).sort({createdAt: -1});
    const waitMs = last ? last.createdAt.getTime() + config.otpResendAfterMs - Date.now() : 0;
    if (waitMs > 0) {
      throw new ApiError(
        429,
        'RESEND_TOO_SOON',
        `Wait ${Math.ceil(waitMs / 1000)} seconds before asking for a new code`,
      );
    }

    const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
    await Otp.deleteMany({email: req.body.email});
    await Otp.create({
      email: req.body.email,
      codeHash: sha256(code),
      expiresAt: new Date(Date.now() + config.otpLifetimeMs),
    });

    // The email names the site the person came from: "your Pirento Legal sign-in code".
    const brand = getProduct(req.body.product ?? '')?.name ?? 'Pirento Ecosystem';
    if (mailer()) {
      try {
        await sendOtpEmail(req.body.email, code, brand);
      } catch (err) {
        console.error('OTP email failed:', err.message);
        await Otp.deleteMany({email: req.body.email});
        throw new ApiError(502, 'EMAIL_FAILED', 'We could not send the code. Check the email and try again.');
      }
    } else {
      console.log(`OTP for ${req.body.email}: ${code} (no SMTP_URL, so not emailed)`);
    }

    // Outside production the code comes back in the response, so local testing needs no inbox.
    res.json({
      data: {sent: true, resendAfter: config.otpResendAfterMs / 1000, ...(config.isProduction ? {} : {devCode: code})},
    });
  },
);

otpRoutes.post(
  '/otp/verify',
  validate(z.object({email, code: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code')})),
  async (req, res) => {
    const otp = await Otp.findOneAndUpdate({email: req.body.email}, {$inc: {attempts: 1}}, {new: true});
    if (!otp || otp.expiresAt < new Date() || otp.attempts > config.otpMaxAttempts) {
      throw new ApiError(400, 'OTP_EXPIRED', 'This code has expired. Ask for a new one.');
    }
    const given = Buffer.from(sha256(req.body.code));
    if (!crypto.timingSafeEqual(Buffer.from(otp.codeHash), given)) {
      throw new ApiError(400, 'OTP_WRONG', 'That code is not right');
    }
    await Otp.deleteOne({_id: otp._id});

    // First sign-in creates the account. Bootstrap emails are always superadmin.
    const isBootstrap = config.superadminEmails().includes(req.body.email);
    const user = await User.findOneAndUpdate(
      {email: req.body.email},
      isBootstrap ? {$set: {role: 'superadmin'}} : {$setOnInsert: {role: 'customer'}},
      {upsert: true, new: true},
    );
    await issueSession(res, user);
  },
);
