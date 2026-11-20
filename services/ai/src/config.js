import {env} from '@pirento/shared/server';

export const config = {
  port: Number(env('PORT', 4009)),
  mongoUri: env('MONGO_URI', 'mongodb://127.0.0.1:27017/pirento_ai'),
  /** Without a key the assistant stays off and says so, instead of failing. */
  enabled: Boolean(process.env.ANTHROPIC_API_KEY),
};
