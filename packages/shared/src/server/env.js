/**
 * Reads an environment variable, with a development fallback.
 *
 * In production a secret or key that is still on its dev fallback stops the
 * service at boot. A service that starts with a guessable JWT secret is worse
 * than one that does not start at all.
 */
export function env(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) throw new Error(`Missing environment variable ${name}`);
  if (process.env.NODE_ENV === 'production' && value === fallback && /SECRET|KEY/.test(name)) {
    throw new Error(`Set a real ${name} in production`);
  }
  return value;
}

export const isProduction = () => process.env.NODE_ENV === 'production';
