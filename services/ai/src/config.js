import {env} from '@pirento/shared/server';

const url = (name, port) => env(`${name}_URL`, `http://127.0.0.1:${port}`);

export const config = {
  port: Number(env('PORT', 4009)),
  mongoUri: env('MONGO_URI', 'mongodb://127.0.0.1:27017/pirento_ai'),
  /** Without a key the assistant stays off and says so, instead of failing. */
  enabled: Boolean(process.env.ANTHROPIC_API_KEY),
  walletUrl: url('WALLET', 4002),
  // Where the assistant reads a person's own account (each service's /internal/assistant).
  areas: {
    wallet: url('WALLET', 4002),
    orders: url('ORDERS', 4004),
    bharat_id: url('IDENTITY', 4005),
    intern: url('LEARNING', 4006),
    support: url('SUPPORT', 4008),
  },
};
