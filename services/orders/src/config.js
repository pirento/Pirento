import {env, keyFrom} from '@pirento/shared/server';

export const config = {
  port: Number(env('PORT', 4004)),
  mongoUri: env('MONGO_URI', 'mongodb://127.0.0.1:27017/pirento_orders'),
  walletUrl: env('WALLET_URL', 'http://127.0.0.1:4002'),
  catalogUrl: env('CATALOG_URL', 'http://127.0.0.1:4003'),
  authUrl: env('AUTH_URL', 'http://127.0.0.1:4001'), // who a staff booking is for
  aiUrl: env('AI_URL', 'http://127.0.0.1:4009'), // checks a customer's documents before the team does
  /** Encrypts the documents attached to orders. Changing it makes stored documents unreadable. */
  fileKey: keyFrom(env('ORDERS_FILE_KEY', 'dev-only-orders-file-key')),
  // shortcut: documents live inside MongoDB documents (16 MB cap each); move them to S3 before raising these.
  maxFileBytes: 5 * 1024 * 1024,
  maxFilesPerOrder: 20,
};

/** Prefix of the public completion code per product, e.g. BLK-7F3A9C21. */
export const CODE_PREFIX = {legal: 'LGL', black: 'BLK', green: 'GRN', giftox: 'GFT'};

/** Statuses that mean the customer has paid. */
export const PAID_STATUSES = ['paid', 'in_progress', 'completed'];
