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

export function createApp(name, {json = true} = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  if (json) app.use(express.json({limit: '100kb'}));
  app.get('/health', (_req, res) => res.json({data: {service: name, ok: true}}));
  return app;
}

// Call after all routes are mounted.
export function finish(app) {
  app.use((_req, _res, next) => next(new ApiError(404, 'NOT_FOUND', 'Route not found')));
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    const status = err.status ?? 500;
    if (status >= 500) console.error(err);
    res.status(status).json({
      error: {code: err.code ?? 'INTERNAL', message: status >= 500 ? 'Something went wrong' : err.message},
    });
  });
  return app;
}

export function env(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) throw new Error(`Missing environment variable ${name}`);
  if (process.env.NODE_ENV === 'production' && name === 'JWT_SECRET' && value === fallback) {
    throw new Error('Set a real JWT_SECRET in production');
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
