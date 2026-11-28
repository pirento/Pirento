// The vault service's settings, read from the environment with safe defaults for local work.
import {VAULT_LIMITS} from '@pirento/shared';
import {env, keyFrom} from '@pirento/shared/server';

const digioSandbox = env('DIGIO_ENV', 'sandbox') !== 'production';

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
  aiUrl: env('AI_URL', 'http://127.0.0.1:4009'), // reads a death certificate to match it to the owner
  /**
   * Digio's Account Aggregator (FIU-TSP): fetches mutual funds, stocks, ETFs and insurance with the owner's consent.
   * Off until the keys and a consent template (made in Digio's FIU dashboard) are set. Only a regulated entity may
   * be an FIU, so this needs Pirento's FIU registration or a regulated partner's.
   */
  digio: {
    clientId: env('DIGIO_CLIENT_ID', ''),
    clientSecret: env('DIGIO_CLIENT_SECRET', ''),
    webhookSecret: env('DIGIO_WEBHOOK_SECRET', ''),
    environment: digioSandbox ? 'sandbox' : 'production',
    api: env('DIGIO_AA_URL', digioSandbox ? 'https://ext.digio.in:444/fiu_api' : 'https://api.digio.in/fiu_api'),
    sdk: digioSandbox ? 'https://ext.digio.in/sdk/v12/digio.js' : 'https://app.digio.in/sdk/v12/digio.js',
    template: env('DIGIO_AA_TEMPLATE', ''),
  },
  /** API Setu: checks a death certificate with the body that issued it. Off until both keys are set. */
  apisetu: {
    url: env('APISETU_URL', 'https://apisetu.gov.in'),
    clientId: env('APISETU_CLIENT_ID', ''),
    apiKey: env('APISETU_API_KEY', ''),
  },
};

export const aaOn = () => Boolean(config.digio.clientId && config.digio.clientSecret && config.digio.template);
export const apisetuOn = () => Boolean(config.apisetu.clientId && config.apisetu.apiKey);
