// Auth service: sign-in (email code, Bharat ID, Google, staff door), sessions, profiles, roles and the audit trail.
import {createApp, finish, start} from '@pirento/shared/server';
import {config} from './config.js';
import {otpRoutes} from './routes/otp.routes.js';
import {sessionRoutes} from './routes/session.routes.js';
import {meRoutes} from './routes/me.routes.js';
import {adminRoutes} from './routes/admin.routes.js';
import {internalRoutes} from './routes/internal.routes.js';
import {doorRoutes} from './routes/door.routes.js';
import {accountRoutes} from './routes/account.routes.js';
import {seedSuperadmin} from './lib/seed.js';

const app = createApp('auth');
app.use(otpRoutes, doorRoutes, accountRoutes, sessionRoutes, meRoutes, adminRoutes, internalRoutes);

await start(finish(app), {name: 'auth', port: config.port, mongoUri: config.mongoUri});
await seedSuperadmin();
