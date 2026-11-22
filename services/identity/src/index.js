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
import {authorizeRoutes} from './routes/authorize.routes.js';
import {pinRoutes} from './routes/pin.routes.js';
import {enrolRoutes} from './routes/enrol.routes.js';
import {startReminders} from './lib/reminders.js';

const app = createApp('identity');
app.use(
  internalRoutes,
  publicRoutes,
  webhookRoutes,
  apiRoutes,
  businessRoutes,
  consentRoutes,
  authorizeRoutes,
  pinRoutes,
  applicationRoutes,
  staffBusinessRoutes,
  enrolRoutes,
  staffRoutes,
);

start(finish(app), {name: 'identity', port: config.port, mongoUri: config.mongoUri});
startReminders(); // email and SMS reminders for unfinished applications
