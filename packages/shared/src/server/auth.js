import jwt from 'jsonwebtoken';
import {env} from './env.js';
import {ApiError} from './errors.js';

/** Roles that may work the staff queues. */
export const STAFF = ['staff', 'superadmin'];

export const jwtSecret = () => env('JWT_SECRET', 'dev-only-secret-change-me');

/**
 * Accepts a request only with a valid access token, and puts its claims on
 * `req.user` ({sub, email, role}). Every service checks the token itself, so a
 * request that somehow skips the gateway is still refused.
 */
export function requireAuth(req, _res, next) {
  const token = req.headers.authorization?.replace(/^Bearer /, '');
  try {
    req.user = jwt.verify(token ?? '', jwtSecret());
    next();
  } catch {
    next(new ApiError(401, 'UNAUTHORIZED', 'Sign in to continue'));
  }
}

/** Use after requireAuth: `requireRole(...STAFF)`. */
export const requireRole =
  (...roles) =>
  (req, _res, next) =>
    roles.includes(req.user?.role) ? next() : next(new ApiError(403, 'FORBIDDEN', 'You do not have access to this'));

export const isStaff = (req) => STAFF.includes(req.user?.role);
