// The Express app every service starts from: JSON, security headers, rate limits, errors.
import express from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import {ApiError} from './errors.js';
import {usesMongo} from './db.js';

/**
 * A new Express app with the defaults every Pirento service shares:
 * security headers, a small JSON body limit, and GET /health.
 *
 * `json: false` is for the gateway, which must pass request bodies through
 * untouched. `csp` replaces helmet's Content-Security-Policy directives. `ready` (async, throws when not)
 * adds a check to /health. `jsonLimit` raises the body limit for a service that takes files in JSON (the AI).
 */
export function createApp(name, {json = true, jsonLimit = '100kb', csp, ready} = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet(csp ? {contentSecurityPolicy: {directives: csp}} : {}));

  // rawBody keeps the exact bytes: payment webhooks are signed over them.
  if (json) app.use(express.json({limit: jsonLimit, verify: (req, _res, buf) => (req.rawBody = buf)}));

  // The load balancer's check: a copy that lost its database is taken out of rotation until it reconnects.
  // `ready` is a service's own check of its other stores (the wallet's PostgreSQL).
  app.get('/health', async (_req, res) => {
    const ok =
      (!usesMongo.on || mongoose.connection.readyState === 1) &&
      (!ready ||
        (await ready().then(
          () => true,
          () => false,
        )));
    res.status(ok ? 200 : 503).json({data: {service: name, ok}});
  });
  return app;
}

/** Adds the 404 and error handlers. Call it after every route is mounted. */
export function finish(app) {
  app.use((_req, _res, next) => next(new ApiError(404, 'NOT_FOUND', 'Route not found')));

  // Express recognises an error handler by its four arguments, so `_next` stays.
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    const status = err.status ?? 500;
    const meantForUser = err instanceof ApiError || status < 500;
    if (!meantForUser) console.error(err);
    res.status(status).json({
      error: {
        code: meantForUser ? (err.code ?? 'ERROR') : 'INTERNAL',
        message: meantForUser ? err.message : 'Something went wrong',
      },
    });
  });
  return app;
}
