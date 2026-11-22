// Identity service: Bharat ID applications, verification on Digio (video KYC, eSign, e-stamp),
// staff review and the public verify page.
import {createApp, finish, start} from '@pirento/shared/server';
import {config} from './config.js';
import {internalRoutes} from './routes/internal.routes.js';
import {publicRoutes} from './routes/public.routes.js';
import {applicationRoutes} from './routes/application.routes.js';
import {staffRoutes} from './routes/staff.routes.js';
import {webhookRoutes} from './routes/webhook.routes.js';

const app = createApp('identity');
app.use(internalRoutes, publicRoutes, webhookRoutes, applicationRoutes, staffRoutes);

start(finish(app), {name: 'identity', port: config.port, mongoUri: config.mongoUri});
