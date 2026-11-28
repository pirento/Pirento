// The support service's settings, read from the environment with safe defaults for local work.
import {env} from '@pirento/shared/server';

export const config = {
  port: Number(env('PORT', 4008)),
  mongoUri: env('MONGO_URI', 'mongodb://127.0.0.1:27017/pirento_support'),
  aiUrl: env('AI_URL', 'http://127.0.0.1:4009'), // sorts new tickets, and answers on WhatsApp
  authUrl: env('AUTH_URL', 'http://127.0.0.1:4001'), // whose account a WhatsApp number is
  siteUrl: env('SITE_URL', 'https://pirento.com').replace(/\/$/, ''),
  /** Meta's check when the WhatsApp webhook is registered: the same text in Meta's dashboard. */
  whatsappVerifyToken: env('WHATSAPP_VERIFY_TOKEN', ''),
};
