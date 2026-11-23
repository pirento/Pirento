import {env} from '@pirento/shared/server';

export const config = {
  port: Number(env('PORT', 4008)),
  mongoUri: env('MONGO_URI', 'mongodb://127.0.0.1:27017/pirento_support'),
  aiUrl: env('AI_URL', 'http://127.0.0.1:4009'), // sorts new tickets (priority, product, category)
};
