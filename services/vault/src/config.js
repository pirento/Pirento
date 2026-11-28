// The vault service's settings, read from the environment with safe defaults for local work.
import {VAULT_LIMITS} from '@pirento/shared';
import {env, keyFrom} from '@pirento/shared/server';

export const config = {
  port: Number(env('PORT', 4007)),
  mongoUri: env('MONGO_URI', 'mongodb://127.0.0.1:27017/pirento_vault'),
  /** Encrypts every file and password. Changing it makes stored Vault data unreadable. */
  key: keyFrom(env('VAULT_ENCRYPTION_KEY', 'dev-only-vault-key')),
  // Inside MongoDB a document holds at most 16 MB; with FILES_S3_BUCKET set the bytes live in the bucket, and
  // VAULT_LIMITS can be raised past that.
  maxFileBytes: VAULT_LIMITS.fileMb * 1024 * 1024,
  quotaBytes: VAULT_LIMITS.totalMb * 1024 * 1024,
  identityUrl: env('IDENTITY_URL', 'http://127.0.0.1:4005'),
  authUrl: env('AUTH_URL', 'http://127.0.0.1:4001'),
  /** Where links in reminders and release messages point. */
  siteUrl: env('SITE_URL', 'http://localhost:5173'),
};
