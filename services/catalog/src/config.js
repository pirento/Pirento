// The catalog service's settings, read from the environment with safe defaults for local work.
import {env} from '@pirento/shared/server';

// Everything the catalog service reads from the environment.
export const config = {
  port: Number(env('PORT', 4003)),
  // Site settings and the admin's edits live here; the base products and prices stay in packages/shared.
  mongoUri: env('MONGO_URI', 'mongodb://127.0.0.1:27017/pirento_catalog'),
};
