// Auth service: email sign-in codes, sessions, profiles and roles.
import {createApp, finish, start} from '@pirento/shared/server';
import {config} from './config.js';
import {otpRoutes} from './routes/otp.routes.js';
import {sessionRoutes} from './routes/session.routes.js';
import {meRoutes} from './routes/me.routes.js';
import {adminRoutes} from './routes/admin.routes.js';
import {internalRoutes} from './routes/internal.routes.js';

const app = createApp('auth');
app.use(otpRoutes, sessionRoutes, meRoutes, adminRoutes, internalRoutes);

start(finish(app), {name: 'auth', port: config.port, mongoUri: config.mongoUri});
