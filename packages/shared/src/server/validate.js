// Request checking with zod, so routes only ever see clean input.
import {ApiError} from './errors.js';

/**
 * Route middleware: checks req.body against a zod schema and replaces it with
 * the parsed (trimmed, defaulted) value. The first problem is reported, in the
 * schema's own words, so write those messages for people.
 */
export const validate = (schema) => (req, _res, next) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return next(new ApiError(400, 'INVALID_INPUT', parsed.error.issues[0].message));
  req.body = parsed.data;
  next();
};
