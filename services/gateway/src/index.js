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
};

// No body parsing here: the proxy must forward the raw request body.
const app = createApp('gateway', {json: false});
app.set('trust proxy', 1);
app.use('/api', rateLimit({windowMs: 60_000, limit: Number(env('RATE_LIMIT_PER_MIN', 300))}));
app.use('/api/auth/otp', rateLimit({windowMs: 15 * 60_000, limit: Number(env('RATE_LIMIT_OTP', 20))}));

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
