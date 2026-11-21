// Catalog service: products and services (packages/shared) with the admin's edits and new services, plus site settings.
import {createApp, finish, start} from '@pirento/shared/server';
import {config} from './config.js';
import {catalogRoutes} from './routes/catalog.routes.js';
import {settingsRoutes} from './routes/settings.routes.js';
import {priceRoutes} from './routes/price.routes.js';
import {serviceRoutes} from './routes/service.routes.js';

const app = createApp('catalog');
app.use(settingsRoutes, priceRoutes, serviceRoutes, catalogRoutes);

start(finish(app), {name: 'catalog', port: config.port, mongoUri: config.mongoUri});
