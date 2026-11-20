/**
 * The one error type a service throws on purpose.
 *
 * Every response is either `{data}` or `{error: {code, message}}`. Throw an
 * ApiError when the caller did something we can explain (bad input, not found,
 * not allowed); its message is shown to the user as written. Anything else that
 * escapes a route is treated as a bug and hidden behind "Something went wrong".
 */
export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// Shorthands for the errors we raise most, so routes read like sentences.
export const notFound = (what = 'Not found') => new ApiError(404, 'NOT_FOUND', what);
export const badInput = (message) => new ApiError(400, 'INVALID_INPUT', message);
export const conflict = (code, message) => new ApiError(409, code, message);
