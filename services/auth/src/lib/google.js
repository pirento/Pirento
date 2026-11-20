import {ApiError} from '@pirento/shared/server';

const ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];

/**
 * Checks a Google Identity Services ID token with Google's tokeninfo endpoint
 * and returns the profile. The audience must be our client id and the email
 * verified, or the token is refused.
 * shortcut: one HTTPS call per sign-in; verify locally against Google's JWKS if sign-ins get busy.
 */
export async function verifyGoogleIdToken(idToken, clientId, fetchImpl = fetch) {
  const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
  const res = await fetchImpl(url, {signal: AbortSignal.timeout(8000)}).catch(() => null);
  const info = res?.ok ? await res.json() : null;
  if (!info || info.aud !== clientId || !ISSUERS.includes(info.iss)) {
    throw new ApiError(401, 'GOOGLE_INVALID', 'Google sign-in could not be confirmed. Try again.');
  }
  if (Number(info.exp) * 1000 < Date.now()) {
    throw new ApiError(401, 'GOOGLE_INVALID', 'That Google sign-in expired. Try again.');
  }
  if (info.email_verified !== 'true' && info.email_verified !== true) {
    throw new ApiError(401, 'GOOGLE_UNVERIFIED', 'Your Google email is not verified.');
  }
  return {googleId: String(info.sub), email: String(info.email).toLowerCase(), name: info.name ?? ''};
}
