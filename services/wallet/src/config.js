import {env, isProduction} from '@pirento/shared/server';

export const config = {
  port: Number(env('PORT', 4002)),
  mongoUri: env('MONGO_URI', 'mongodb://127.0.0.1:27017/pirento_wallet'),
  // Test money is refused in production unless someone switches it on on purpose.
  testTopupAllowed: () => !isProduction() || process.env.ALLOW_TEST_TOPUP === 'true',
};
