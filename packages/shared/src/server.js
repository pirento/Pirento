import crypto from 'node:crypto';
import express from 'express';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// Every service answers {data} on success and {error: {code, message}} on failure.
export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function createApp(name, {json = true, csp} = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet(csp ? {contentSecurityPolicy: {directives: csp}} : {}));
  // rawBody keeps the exact bytes, needed to check payment webhook signatures.
  if (json) app.use(express.json({limit: '100kb', verify: (req, _res, buf) => (req.rawBody = buf)}));
  app.get('/health', (_req, res) => res.json({data: {service: name, ok: true}}));
  return app;
}

// Call after all routes are mounted.
export function finish(app) {
  app.use((_req, _res, next) => next(new ApiError(404, 'NOT_FOUND', 'Route not found')));
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    const status = err.status ?? 500;
    // Our own ApiErrors (and 4xx) are meant for the user; anything unexpected stays hidden.
    const shown = err instanceof ApiError || status < 500;
    if (!shown) console.error(err);
    res.status(status).json({
      error: {code: shown ? (err.code ?? 'ERROR') : 'INTERNAL', message: shown ? err.message : 'Something went wrong'},
    });
  });
  return app;
}

export function env(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) throw new Error(`Missing environment variable ${name}`);
  if (process.env.NODE_ENV === 'production' && value === fallback && /SECRET|KEY/.test(name)) {
    throw new Error(`Set a real ${name} in production`);
  }
  return value;
}

export const jwtSecret = () => env('JWT_SECRET', 'dev-only-secret-change-me');

export function requireAuth(req, _res, next) {
  const token = req.headers.authorization?.replace(/^Bearer /, '');
  try {
    req.user = jwt.verify(token ?? '', jwtSecret());
    next();
  } catch {
    next(new ApiError(401, 'UNAUTHORIZED', 'Sign in to continue'));
  }
}

export const requireRole =
  (...roles) =>
  (req, _res, next) =>
    roles.includes(req.user?.role) ? next() : next(new ApiError(403, 'FORBIDDEN', 'You do not have access to this'));

// Service-to-service calls carry a shared key; the gateway never forwards /internal paths.
const internalKey = () => env('INTERNAL_KEY', 'dev-only-internal-key');
export const safeEqual = (a, b) => {
  const x = Buffer.from(String(a ?? ''));
  const y = Buffer.from(String(b ?? ''));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
export function requireInternal(req, _res, next) {
  safeEqual(req.headers['x-internal-key'], internalKey())
    ? next()
    : next(new ApiError(403, 'FORBIDDEN', 'Internal route'));
}

/** POST to another service's /internal route. Throws its ApiError on failure. */
export async function callService(baseUrl, path, body) {
  const res = await fetch(baseUrl + path, {
    method: 'POST',
    headers: {'content-type': 'application/json', 'x-internal-key': internalKey()},
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new ApiError(res.status, json.error?.code ?? 'UPSTREAM', json.error?.message ?? 'Service unavailable');
  return json.data;
}

export const STAFF = ['staff', 'superadmin'];

// Atomic counter per service database: order numbers, ticket numbers, ID sequences.
let Counter;
export async function nextSeq(name) {
  Counter ??= mongoose.model('Counter', new mongoose.Schema({_id: String, seq: Number}));
  return (await Counter.findOneAndUpdate({_id: name}, {$inc: {seq: 1}}, {upsert: true, new: true})).seq;
}

export async function start(app, {name, port, mongoUri}) {
  if (mongoUri) await mongoose.connect(mongoUri);
  app.listen(port, () => console.log(`${name} listening on :${port}`));
}

// Validates req.body with a zod schema and replaces it with the parsed value.
export const validate = (schema) => (req, _res, next) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return next(new ApiError(400, 'INVALID_INPUT', parsed.error.issues[0].message));
  req.body = parsed.data;
  next();
};
