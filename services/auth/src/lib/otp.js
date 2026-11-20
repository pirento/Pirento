// Email sign-in codes: send one, and check one. Used by the email and the Bharat ID sign-in.
import crypto from 'node:crypto';
import {ApiError} from '@pirento/shared/server';
import {config} from '../config.js';
import {Otp} from '../models/Otp.js';
import {mailer, sendOtpEmail} from './email.js';
import {sha256} from './session.js';

/** Sends a fresh 6-digit code to `email`. Returns what the browser may see. */
export async function sendCode(email, brand) {
  // Without a mail server, production would accept emails and never deliver a code.
  if (config.isProduction && !mailer()) {
    throw new ApiError(503, 'EMAIL_UNAVAILABLE', 'Email sign-in is not set up yet');
  }

  // One code per 30 seconds per email keeps the inbox (and the SMTP bill) sane.
  const last = await Otp.findOne({email}).sort({createdAt: -1});
  const waitMs = last ? last.createdAt.getTime() + config.otpResendAfterMs - Date.now() : 0;
  if (waitMs > 0) {
    throw new ApiError(429, 'RESEND_TOO_SOON', `Wait ${Math.ceil(waitMs / 1000)} seconds before asking for a new code`);
  }

  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  await Otp.deleteMany({email});
  await Otp.create({email, codeHash: sha256(code), expiresAt: new Date(Date.now() + config.otpLifetimeMs)});

  if (mailer()) {
    try {
      await sendOtpEmail(email, code, brand);
    } catch (err) {
      console.error('OTP email failed:', err.message);
      await Otp.deleteMany({email});
      throw new ApiError(502, 'EMAIL_FAILED', 'We could not send the code. Check the email and try again.');
    }
  } else {
    console.log(`OTP for ${email}: ${code} (no SMTP_URL, so not emailed)`);
  }

  // Outside production the code comes back in the response, so local testing needs no inbox.
  return {sent: true, resendAfter: config.otpResendAfterMs / 1000, ...(config.isProduction ? {} : {devCode: code})};
}

/** Throws unless `code` is the live code for `email`; a right code is used up. */
export async function checkCode(email, code) {
  const otp = await Otp.findOneAndUpdate({email}, {$inc: {attempts: 1}}, {new: true});
  if (!otp || otp.expiresAt < new Date() || otp.attempts > config.otpMaxAttempts) {
    throw new ApiError(400, 'OTP_EXPIRED', 'This code has expired. Ask for a new one.');
  }
  if (!crypto.timingSafeEqual(Buffer.from(otp.codeHash), Buffer.from(sha256(code)))) {
    throw new ApiError(400, 'OTP_WRONG', 'That code is not right');
  }
  await Otp.deleteOne({_id: otp._id});
}

/** "asha.verma@gmail.com" → "as•••@gmail.com", to show where a code went without revealing it. */
export const maskEmail = (email) => email.replace(/^(.{1,2})[^@]*(@.*)$/, '$1•••$2');
