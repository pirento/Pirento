// Identity service: Bharat ID applications, verification on Digio (video KYC, eSign, e-stamp),
// staff review, the public verify page, and Bharat ID for Business (requests, dashboard, API).
import {createApp, finish, start} from '@pirento/shared/server';
import {config} from './config.js';
import {internalRoutes} from './routes/internal.routes.js';
import {publicRoutes} from './routes/public.routes.js';
import {applicationRoutes} from './routes/application.routes.js';
import {staffRoutes} from './routes/staff.routes.js';
import {webhookRoutes} from './routes/webhook.routes.js';
import {apiRoutes} from './routes/api.routes.js';
import {businessRoutes} from './routes/business.routes.js';
import {consentRoutes} from './routes/consent.routes.js';
import {staffBusinessRoutes} from './routes/staffBusiness.routes.js';

const app = createApp('identity');
app.use(
  internalRoutes,
  publicRoutes,
  webhookRoutes,
  apiRoutes,
  businessRoutes,
  consentRoutes,
  applicationRoutes,
  staffBusinessRoutes,
  staffRoutes,
);

start(finish(app), {name: 'identity', port: config.port, mongoUri: config.mongoUri});
