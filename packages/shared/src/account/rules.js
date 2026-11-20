// Account rules the sign-up form and the auth service both check: mobile numbers, user IDs, passwords, terms.

/** The terms a new account accepts. Change it when the text at /terms changes. */
export const TERMS_VERSION = '2026-11-20';

export const MIN_PASSWORD = 8;

/** An Indian mobile, as typed ("98765 43210", "+91 98765-43210") → "+919876543210", or null. */
export function toPhone(raw) {
  const digits = String(raw ?? '').replace(/\D/g, '');
  const local = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  return /^[6-9]\d{9}$/.test(local) ? `+91${local}` : null;
}

/** "+919876543210" → "+91 ••••• •3210", to show where a code went. */
export const maskPhone = (phone) => `+91 ••••• •${String(phone).slice(-4)}`;

/** A user ID: 3–30 characters, starts with a letter; letters, digits, dot, dash, underscore. No "@". */
export const isUsername = (value) => /^[a-z][a-z0-9._-]{2,29}$/.test(String(value ?? ''));

/** Why a password is not good enough, or '' when it is. */
export function passwordProblem(password) {
  const p = String(password ?? '');
  if (p.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters`;
  if (!/[a-zA-Z]/.test(p) || !/\d/.test(p)) return 'Use at least one letter and one number';
  return '';
}
