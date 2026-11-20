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

  walletUrl: env('WALLET_URL', 'http://127.0.0.1:4002'),
  /** Services that keep personal data and forget it when an account is deleted. */
  forgetUrls: () => [
    env('IDENTITY_URL', 'http://127.0.0.1:4005'),
    env('VAULT_URL', 'http://127.0.0.1:4007'),
    env('AI_URL', 'http://127.0.0.1:4009'),
    env('LEARNING_URL', 'http://127.0.0.1:4006'),
  ],

  /** Emails promoted to superadmin on sign-in: the way to bootstrap the first admin. */
  superadminEmails: () =>
    env('SUPERADMIN_EMAILS', '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
};
