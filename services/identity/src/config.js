// Identity service settings: its database, the key for legacy KYC videos, and the Digio account.
import {env, keyFrom} from '@pirento/shared/server';

const digioSandbox = env('DIGIO_ENV', 'sandbox') !== 'production';

export const config = {
  port: Number(env('PORT', 4005)),
  mongoUri: env('MONGO_URI', 'mongodb://127.0.0.1:27017/pirento_identity'),
  authUrl: env('AUTH_URL', 'http://127.0.0.1:4001'), // makes Bharat ID for Business accounts and emails them
  siteUrl: env('SITE_URL', 'http://localhost:5173').replace(/\/$/, ''), // for the sign-in link in those emails
  walletUrl: env('WALLET_URL', 'http://127.0.0.1:4002'), // business checks are paid from the owner's wallet
  /** Decrypts videos recorded before KYC moved to Digio. Changing it makes them unreadable. */
  kycKey: keyFrom(env('KYC_ENCRYPTION_KEY', 'dev-only-kyc-key')),
  /**
   * Digio runs video KYC (with DigiLocker), the Aadhaar eSign of the declaration, and its e-stamp.
   * Off until both keys are set. DIGIO_URL points at a stand-in server in local tests.
   */
  digio: {
    clientId: env('DIGIO_CLIENT_ID', ''),
    clientSecret: env('DIGIO_CLIENT_SECRET', ''),
    webhookSecret: env('DIGIO_WEBHOOK_SECRET', ''),
    environment: digioSandbox ? 'sandbox' : 'production',
    api: env('DIGIO_URL', digioSandbox ? 'https://ext.digio.in:444' : 'https://api.digio.in'),
    sdk: digioSandbox ? 'https://ext.digio.in/sdk/v11/digio.js' : 'https://app.digio.in/sdk/v11/digio.js',
    kycTemplate: env('DIGIO_KYC_TEMPLATE', 'VIDEO_KYC'), // Digio's standard video KYC workflow, or one made in DigiStudio
    // Templates made in DigiStudio for checking a holder later; a method stays off until its template is named.
    aadhaarTemplate: env('DIGIO_AADHAAR_TEMPLATE', ''), // Aadhaar OTP (offline KYC), matched to the holder's name
    faceTemplate: env('DIGIO_FACE_TEMPLATE', ''), // selfie with liveness, matched to the holder's KYC
    estampTag: env('DIGIO_ESTAMP_TAG', ''), // a stamp tag from the Digio dashboard (E-Stamping); empty signs without a stamp
  },
};

export const digioOn = () => Boolean(config.digio.clientId && config.digio.clientSecret);
