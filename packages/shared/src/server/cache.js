// Redis, shared by every copy of every service behind the load balancer: a short cache for hot reads (site
// settings, prices, tracks) and the store for rate limits. Without REDIS_URL (development, tests) the cache lives
// in this process's memory, which is right for one copy of a service.
import {createClient} from 'redis';
import {env} from './env.js';

let client;
/** The shared Redis client, or null when REDIS_URL is not set. Commands queue until it connects. */
export function redis() {
  if (client !== undefined) return client;
  const url = env('REDIS_URL', '');
  client = url ? createClient({url}) : null;
  if (client) {
    // A Redis outage must not take the site down: reads fall back to the database (see cached()).
    client.on('error', (err) => console.error('redis', err.message));
    client.connect().catch((err) => console.error('redis connect', err.message));
  }
  return client;
}

const local = new Map();

/**
 * The value under `key`, loaded with `load()` at most once per `ttlSeconds` across every server. Values are
 * stored as JSON, so return plain data. Writes call forget(key) so an edit shows at once everywhere.
 */
export async function cached(key, ttlSeconds, load) {
  const r = redis();
  if (r?.isReady) {
    const hit = await r.get(key).catch(() => null);
    if (hit) return JSON.parse(hit);
    const value = await load();
    r.set(key, JSON.stringify(value), {EX: ttlSeconds}).catch(() => {});
    return value;
  }
  const hit = local.get(key);
  if (hit && hit.until > Date.now()) return hit.value;
  const value = await load();
  local.set(key, {value, until: Date.now() + ttlSeconds * 1000});
  return value;
}

/** Drops cached values after a write. */
export async function forget(...keys) {
  for (const k of keys) local.delete(k);
  const r = redis();
  if (r?.isReady) await r.del(keys).catch(() => {});
}

/** Mongoose middleware: every write through this schema forgets `keys`. */
export function forgetOnWrite(schema, ...keys) {
  const drop = () => forget(...keys);
  schema.post(
    ['save', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany', 'findOneAndUpdate', 'findOneAndDelete'],
    drop,
  );
  schema.post('insertMany', drop);
}
