import {env} from '@pirento/shared/server';

export const config = {
  port: Number(env('PORT', 4004)),
  mongoUri: env('MONGO_URI', 'mongodb://127.0.0.1:27017/pirento_orders'),
  walletUrl: env('WALLET_URL', 'http://127.0.0.1:4002'),
};

/** Prefix of the public completion code per product, e.g. BLK-7F3A9C21. */
export const CODE_PREFIX = {legal: 'LGL', black: 'BLK', green: 'GRN', giftox: 'GFT'};

/** Statuses that mean the customer has paid. */
export const PAID_STATUSES = ['paid', 'in_progress', 'completed'];
