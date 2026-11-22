// One-time codes for sign-in, sign-up and password resets, by email or by text message.
// A code is stored hashed under a key: the email itself, or "phone:+91…" for a mobile.
import crypto from 'node:crypto';
import {ApiError} from '@pirento/shared/server';
import {config} from '../config.js';
import {Otp} from '../models/Otp.js';
import {mailer, sendOtpEmail} from './email.js';
import {sendSms} from './sms.js';
import {sha256} from './session.js';

export const phoneKey = (phone) => `phone:${phone}`;

/** Makes a fresh code for `key` (one per 30 seconds) and returns it. */
async function newCode(key) {
  const last = await Otp.findOne({email: key}).sort({createdAt: -1});
  const waitMs = last ? last.createdAt.getTime() + config.otpResendAfterMs - Date.now() : 0;
  if (waitMs > 0) {
    throw new ApiError(429, 'RESEND_TOO_SOON', `Wait ${Math.ceil(waitMs / 1000)} seconds before asking for a new code`);
  }
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  await Otp.deleteMany({email: key});
  await Otp.create({email: key, codeHash: sha256(code), expiresAt: new Date(Date.now() + config.otpLifetimeMs)});
  return code;
}

// Outside production the code comes back in the response, so local testing needs no inbox or phone.
const reply = (code) => ({
  sent: true,
  resendAfter: config.otpResendAfterMs / 1000,
  ...(config.isProduction ? {} : {devCode: code}),
});

/** Emails a code. `brand` names the site: "your Pirento Legal sign-in code". */
export async function sendCode(email, brand) {
  // Without a mail server, production would accept emails and never deliver a code.
  if (config.isProduction && !mailer()) throw new ApiError(503, 'EMAIL_UNAVAILABLE', 'Email codes are not set up yet');
  const code = await newCode(email);
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
  return reply(code);
}

/** Texts a code to a +91 mobile. */
export async function sendPhoneCode(phone, brand) {
  const code = await newCode(phoneKey(phone));
  try {
    await sendSms(phone, `${code} is your ${brand} code. It works for 10 minutes. Do not share it.`);
  } catch (err) {
    await Otp.deleteMany({email: phoneKey(phone)});
    throw err;
  }
  return reply(code);
}

/** Throws unless `code` is the live code for `key`; a right code is used up. */
export async function checkCode(key, code) {
  const otp = await Otp.findOneAndUpdate({email: key}, {$inc: {attempts: 1}}, {new: true});
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

/**
 * A code for a purpose other than signing in (a Bharat ID check a business asked for), kept under its own key so it
 * never replaces or answers a sign-in code. `to` is {email} or {phone}.
 */
export async function sendKeyedCode(key, to, brand) {
  if (to.phone) {
    const code = await newCode(key);
    try {
      await sendSms(to.phone, `${code} is your ${brand} code. It works for 10 minutes. Do not share it.`);
    } catch (err) {
      await Otp.deleteMany({email: key});
      throw err;
    }
    return reply(code);
  }
  if (config.isProduction && !mailer()) throw new ApiError(503, 'EMAIL_UNAVAILABLE', 'Email codes are not set up yet');
  const code = await newCode(key);
  if (mailer()) await sendOtpEmail(to.email, code, brand);
  else console.log(`Code for ${to.email}: ${code} (no SMTP_URL, so not emailed)`);
  return reply(code);
}
