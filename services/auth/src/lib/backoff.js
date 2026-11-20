// Slows down repeated wrong passwords on one account: 1s, 2s, 4s… up to a minute.
// No hard lockout, so nobody can lock a colleague out on purpose.
// shortcut: in memory, so it resets on restart and is per instance; move to Mongo or Redis when auth runs on more than one instance.
const CAP_MS = 60_000;
const failures = new Map();

/** Milliseconds to wait before this key may try again (0 = go ahead). */
export function waitFor(key, now = Date.now()) {
  const entry = failures.get(key);
  return entry ? Math.max(0, entry.notBefore - now) : 0;
}

export function recordFailure(key, now = Date.now()) {
  const entry = failures.get(key) ?? {count: 0, notBefore: 0};
  entry.count += 1;
  entry.notBefore = now + Math.min(1000 * 2 ** (entry.count - 1), CAP_MS);
  failures.set(key, entry);
  if (failures.size > 10_000) failures.clear(); // a crude bound on memory
}

export const clearFailures = (key) => failures.delete(key);
