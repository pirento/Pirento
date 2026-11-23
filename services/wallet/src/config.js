// The wallet service's settings, read from the environment with safe defaults for local work.
import {env, isProduction} from '@pirento/shared/server';

export const config = {
  port: Number(env('PORT', 4002)),
  // PostgreSQL (Aurora in production). Money moves in SQL transactions with a balance that can never go below 0.
  databaseUrl: env('DATABASE_URL', 'postgres://pirento:pirento@127.0.0.1:5432/pirento_wallet'),
  databaseSsl: process.env.DATABASE_SSL === 'true',
  poolSize: Number(env('PG_POOL', 20)),
  // Test money is refused in production unless someone switches it on on purpose.
  testTopupAllowed: () => !isProduction() || process.env.ALLOW_TEST_TOPUP === 'true',
};
