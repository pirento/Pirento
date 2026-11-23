// The green service's settings, read from the environment with safe defaults for local work.
import {env, isProduction} from '@pirento/shared/server';

export const config = {
  port: Number(env('PORT', 4010)),
  mongoUri: env('MONGO_URI', 'mongodb://127.0.0.1:27017/pirento_green'),
  walletUrl: env('WALLET_URL', 'http://127.0.0.1:4002'), // every buy and sell moves wallet money
  ordersUrl: env('ORDERS_URL', 'http://127.0.0.1:4004'), // the planted trees credits grow from
  // Buying and selling credits for wallet money. On by default off production; production needs GREEN_TRADING=on.
  tradingOn: env('GREEN_TRADING', isProduction() ? 'off' : 'on') === 'on',
};
