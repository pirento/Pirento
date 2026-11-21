// Gateway: the only public entry point. It rate-limits, blocks internal
// routes, forwards /api/<service>/… to that service, and in production also
// serves the built website.
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import rateLimit from 'express-rate-limit';
import {createProxyMiddleware} from 'http-proxy-middleware';
import {createApp, finish, start} from '@pirento/shared/server';
import {CSP, SERVICES, config} from './config.js';

// No body parsing: the proxy must pass request bodies through byte for byte.
const app = createApp('gateway', {json: false, csp: CSP});
app.set('trust proxy', 1);

app.use('/api', rateLimit({windowMs: 60_000, limit: config.rateLimitPerMinute}));
app.use('/api/auth/otp', rateLimit({windowMs: 15 * 60_000, limit: config.otpRequestsPer15Min}));
// The contact form needs no account, so it gets its own, tighter limit.
app.use('/api/support/enquiries', rateLimit({windowMs: 15 * 60_000, limit: config.enquiriesPer15Min}));

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
