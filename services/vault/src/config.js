import {VAULT_LIMITS} from '@pirento/shared';
import {env, keyFrom} from '@pirento/shared/server';

export const config = {
  port: Number(env('PORT', 4007)),
  mongoUri: env('MONGO_URI', 'mongodb://127.0.0.1:27017/pirento_vault'),
  /** Encrypts every file and password. Changing it makes stored Vault data unreadable. */
  key: keyFrom(env('VAULT_ENCRYPTION_KEY', 'dev-only-vault-key')),
  // shortcut: files live inside MongoDB documents (16 MB cap each); move them to S3 before raising these.
  maxFileBytes: VAULT_LIMITS.fileMb * 1024 * 1024,
  quotaBytes: VAULT_LIMITS.totalMb * 1024 * 1024,
};
