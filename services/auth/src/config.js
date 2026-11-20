import {env, isProduction} from '@pirento/shared/server';

// Everything the auth service reads from the environment, in one place.
export const config = {
  port: Number(env('PORT', 4001)),
  mongoUri: env('MONGO_URI', 'mongodb://127.0.0.1:27017/pirento_auth'),
  isProduction: isProduction(),

  otpLifetimeMs: 10 * 60_000,
  otpMaxAttempts: 5,
  // A fresh code at most every 30 seconds per email. Test runs set OTP_RESEND_SECONDS=0.
  otpResendAfterMs: Number(env('OTP_RESEND_SECONDS', 30)) * 1000,

  accessTokenLife: '15m',
  refreshDays: 30,
  refreshCookie: 'pirento_rt',

  /** Emails promoted to superadmin on sign-in: the way to bootstrap the first admin. */
  superadminEmails: () =>
    env('SUPERADMIN_EMAILS', '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
};
