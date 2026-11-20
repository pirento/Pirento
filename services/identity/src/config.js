import {env, keyFrom} from '@pirento/shared/server';

export const config = {
  port: Number(env('PORT', 4005)),
  mongoUri: env('MONGO_URI', 'mongodb://127.0.0.1:27017/pirento_identity'),
  /** Encrypts KYC videos at rest. Changing it makes stored videos unreadable. */
  kycKey: keyFrom(env('KYC_ENCRYPTION_KEY', 'dev-only-kyc-key')),
  maxVideoBytes: 12 * 1024 * 1024, // ~60 s of camera video; well under MongoDB's 16 MB document limit
  challengeLifeMs: 15 * 60_000, // the spoken code must be recorded within 15 minutes
};
