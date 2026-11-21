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
  identityUrl: env('IDENTITY_URL', 'http://127.0.0.1:4005'),
  /** Google sign-in shows only when this is set (a Google Identity Services web client id). */
  googleClientId: env('GOOGLE_CLIENT_ID', ''),
  /** The first staff sign-in: a superadmin seeded at boot when both are set. */
  superadminStaffId: env('SUPERADMIN_STAFF_ID', ''),
  superadminPassword: env('SUPERADMIN_PASSWORD', ''),
  /** Services that keep personal data and forget it when an account is deleted. */
  // The wallet goes first: it refuses while a withdrawal is still being paid, before anything else is forgotten.
  forgetUrls: () => [
    env('WALLET_URL', 'http://127.0.0.1:4002'),
    env('IDENTITY_URL', 'http://127.0.0.1:4005'),
    env('VAULT_URL', 'http://127.0.0.1:4007'),
    env('AI_URL', 'http://127.0.0.1:4009'),
    env('LEARNING_URL', 'http://127.0.0.1:4006'),
    env('ORDERS_URL', 'http://127.0.0.1:4004'),
    env('SUPPORT_URL', 'http://127.0.0.1:4008'),
  ],

  /** Emails promoted to superadmin on sign-in: the way to bootstrap the first admin. */
  superadminEmails: () =>
    env('SUPERADMIN_EMAILS', '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
};
