// Catalog service: products, the legal catalogue and service prices. No database.
import {createApp, env, finish, start} from '@pirento/shared/server';
import {catalogRoutes} from './routes/catalog.routes.js';

const app = createApp('catalog');
app.use(catalogRoutes);

start(finish(app), {name: 'catalog', port: Number(env('PORT', 4003))});
