import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import rateLimit from 'express-rate-limit';
import {createProxyMiddleware} from 'http-proxy-middleware';
import {createApp, env, finish, start} from '@pirento/shared/server';

// The only public entry point. Browsers talk to /api/<service>/...; the
// gateway rate-limits and forwards to the private service.
const ROUTES = {
  auth: env('AUTH_URL', 'http://127.0.0.1:4001'),
  wallet: env('WALLET_URL', 'http://127.0.0.1:4002'),
  catalog: env('CATALOG_URL', 'http://127.0.0.1:4003'),
  orders: env('ORDERS_URL', 'http://127.0.0.1:4004'),
};

// Razorpay Checkout loads its script and opens its frame from these hosts.
const csp = {
  scriptSrc: ["'self'", 'https://checkout.razorpay.com'],
  frameSrc: ['https://api.razorpay.com', 'https://checkout.razorpay.com'],
  connectSrc: ["'self'", 'https://api.razorpay.com', 'https://lumberjack.razorpay.com'],
  imgSrc: ["'self'", 'data:', 'https:'],
};

// No body parsing here: the proxy must forward the raw request body.
const app = createApp('gateway', {json: false, csp});
app.set('trust proxy', 1);
app.use('/api', rateLimit({windowMs: 60_000, limit: Number(env('RATE_LIMIT_PER_MIN', 300))}));
app.use('/api/auth/otp', rateLimit({windowMs: 15 * 60_000, limit: Number(env('RATE_LIMIT_OTP', 20))}));

// Service-to-service routes are never reachable from outside.
app.use((req, res, next) =>
  /^\/api\/[^/]+\/internal(\/|$)/i.test(decodeURIComponent(req.path))
    ? res.status(404).json({error: {code: 'NOT_FOUND', message: 'Route not found'}})
    : next(),
);

for (const [name, target] of Object.entries(ROUTES)) {
  app.use(`/api/${name}`, createProxyMiddleware({target, changeOrigin: true}));
}

// In production the gateway also serves the built website.
const web = path.resolve(env('WEB_DIST', '../../apps/web/dist'));
if (fs.existsSync(web)) {
  app.use(express.static(web, {index: false, maxAge: '1h'}));
  app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(path.join(web, 'index.html')));
}

start(finish(app), {name: 'gateway', port: Number(env('PORT', 4000))});
