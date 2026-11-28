// The orders service's settings, read from the environment with safe defaults for local work.
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
  // Inside MongoDB a document holds at most 16 MB; with FILES_S3_BUCKET set the bytes live in the bucket, and
  // these can be raised past that.
  maxFileBytes: 5 * 1024 * 1024,
  maxFilesPerOrder: 20,
  /**
   * Blue Dart books and tracks every parcel Pirento sends. Off until the API gateway keys (ClientID / secret, from
   * Blue Dart's developer portal) and the account's login ID, licence key and customer code are set; BLUEDART_URL
   * points at a stand-in in local tests. The shipper is Pirento's dispatch address.
   */
  bluedart: {
    url: env('BLUEDART_URL', 'https://apigateway.bluedart.com/in/transportation'),
    clientId: env('BLUEDART_CLIENT_ID', ''),
    clientSecret: env('BLUEDART_CLIENT_SECRET', ''),
    loginId: env('BLUEDART_LOGIN_ID', ''),
    licenceKey: env('BLUEDART_LICENCE_KEY', ''),
    customerCode: env('BLUEDART_CUSTOMER_CODE', ''),
    originArea: env('BLUEDART_ORIGIN_AREA', ''),
    shipper: {
      name: env('BLUEDART_SHIPPER_NAME', 'Pirento'),
      address: env('BLUEDART_SHIPPER_ADDRESS', ''),
      pincode: env('BLUEDART_SHIPPER_PINCODE', ''),
      mobile: env('BLUEDART_SHIPPER_MOBILE', ''),
    },
  },
};

export const bluedartOn = () =>
  Boolean(
    config.bluedart.clientId && config.bluedart.clientSecret && config.bluedart.loginId && config.bluedart.licenceKey,
  );

/** Prefix of the public completion code per product, e.g. BLK-7F3A9C21. */
export const CODE_PREFIX = {legal: 'LGL', black: 'BLK', green: 'GRN', giftox: 'GFT'};

/** Statuses that mean the customer has paid. */
export const PAID_STATUSES = ['paid', 'in_progress', 'completed'];
