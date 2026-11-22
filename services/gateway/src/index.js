// Gateway: the only public entry point. It rate-limits, blocks internal
// routes, forwards /api/<service>/… to that service, and in production also
// serves the built website.
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import rateLimit from 'express-rate-limit';
import {RedisStore} from 'rate-limit-redis';
import {createProxyMiddleware} from 'http-proxy-middleware';
import {createApp, finish, redis, start} from '@pirento/shared/server';
import {CSP, SERVICES, config} from './config.js';

// No body parsing: the proxy must pass request bodies through byte for byte.
const app = createApp('gateway', {json: false, csp: CSP});
app.set('trust proxy', 1);

// Behind the load balancer many gateways run at once: with REDIS_URL they count each IP together in Redis,
// otherwise each counts alone (fine for one server). If Redis is down the limit lets requests through rather
// than taking the site down.
const r = redis();
const limit = (name, windowMs, max) =>
  rateLimit({
    windowMs,
    limit: max,
    passOnStoreError: true,
    ...(r && {store: new RedisStore({prefix: `rl:${name}:`, sendCommand: (...args) => r.sendCommand(args)})}),
  });

// shortcut: Bharat ID for Business API calls share this per-IP limit; give /api/identity/v1 a per-key limit when a business needs more.
app.use('/api', limit('api', 60_000, config.rateLimitPerMinute));
app.use('/api/auth/otp', limit('otp', 15 * 60_000, config.otpRequestsPer15Min));
// The contact form needs no account, so it gets its own, tighter limit.
app.use('/api/support/enquiries', limit('enquiry', 15 * 60_000, config.enquiriesPer15Min));
app.use('/api/identity/business/requests', limit('bizreq', 15 * 60_000, config.enquiriesPer15Min));
// The Bharat ID check page sends codes and takes PINs, so it gets the sign-in limit too.
app.use('/api/identity/authorize', limit('authorize', 15 * 60_000, config.otpRequestsPer15Min));

// Service-to-service routes (/api/<svc>/internal/…) are never reachable from outside.
const INTERNAL = /^\/api\/[^/]+\/internal(\/|$)/i;
app.use((req, res, next) =>
  INTERNAL.test(decodeURIComponent(req.path))
    ? res.status(404).json({error: {code: 'NOT_FOUND', message: 'Route not found'}})
    : next(),
);

for (const {name, url} of SERVICES) {
  app.use(`/api/${name}`, createProxyMiddleware({target: url, changeOrigin: true}));
}

const web = path.resolve(config.webDist);
if (fs.existsSync(web)) {
  app.use(express.static(web, {index: false, maxAge: '1h'}));
  // Any other path is a page of the single-page app.
  app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(path.join(web, 'index.html')));
}

start(finish(app), {name: 'gateway', port: config.port});
