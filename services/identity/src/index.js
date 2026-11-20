// Identity service: Bharat ID applications, video KYC, staff review and the
// public verify page.
import {createApp, finish, start} from '@pirento/shared/server';
import {config} from './config.js';
import {publicRoutes} from './routes/public.routes.js';
import {applicationRoutes} from './routes/application.routes.js';
import {staffRoutes} from './routes/staff.routes.js';

const app = createApp('identity');
app.use(publicRoutes, applicationRoutes, staffRoutes);

start(finish(app), {name: 'identity', port: config.port, mongoUri: config.mongoUri});
