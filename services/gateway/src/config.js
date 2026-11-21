import {env} from '@pirento/shared/server';

/**
 * Every backend service the gateway knows about. Browsers call
 * /api/<name>/…; the gateway forwards to <NAME>_URL, or to localhost:<port>
 * in development. Adding a service is one line here (plus its own folder).
 */
export const SERVICES = [
  {name: 'auth', port: 4001},
  {name: 'wallet', port: 4002},
  {name: 'catalog', port: 4003},
  {name: 'orders', port: 4004},
  {name: 'identity', port: 4005},
  {name: 'learning', port: 4006},
  {name: 'vault', port: 4007},
  {name: 'support', port: 4008},
  {name: 'ai', port: 4009},
].map((s) => ({...s, url: env(`${s.name.toUpperCase()}_URL`, `http://127.0.0.1:${s.port}`)}));

export const config = {
  port: Number(env('PORT', 4000)),
  webDist: env('WEB_DIST', '../../apps/web/dist'),
  rateLimitPerMinute: Number(env('RATE_LIMIT_PER_MIN', 300)),
  otpRequestsPer15Min: Number(env('RATE_LIMIT_OTP', 20)),
  enquiriesPer15Min: Number(env('RATE_LIMIT_ENQUIRY', 10)),
};

/**
 * Content-Security-Policy additions on top of helmet's strict defaults:
 * Razorpay Checkout (its script and frame), and blob: media so staff can play
 * a Bharat ID video recording and people can preview their own.
 */
export const CSP = {
  // accounts.google.com: Google sign-in (its script, button frame and token check).
  scriptSrc: ["'self'", 'https://checkout.razorpay.com', 'https://accounts.google.com'],
  frameSrc: ['https://api.razorpay.com', 'https://checkout.razorpay.com', 'https://accounts.google.com'],
  connectSrc: ["'self'", 'https://api.razorpay.com', 'https://lumberjack.razorpay.com', 'https://accounts.google.com'],
  imgSrc: ["'self'", 'data:', 'https:'],
  mediaSrc: ["'self'", 'blob:'],
};
