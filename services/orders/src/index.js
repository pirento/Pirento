// Orders service: checkout, payments (wallet and Razorpay), the staff work
// queue, Pirento One referrals and public completion codes.
import {createApp, finish, start} from '@pirento/shared/server';
import {config} from './config.js';
import {publicRoutes} from './routes/public.routes.js';
import {partnerRoutes} from './routes/partner.routes.js';
import {staffRoutes} from './routes/staff.routes.js';
import {paymentRoutes} from './routes/payment.routes.js';
import {customerRoutes} from './routes/customer.routes.js';

const app = createApp('orders');
// Order matters: the fixed paths (/partner, /staff) must come before /:id.
app.use(publicRoutes, partnerRoutes, staffRoutes, paymentRoutes, customerRoutes);

start(finish(app), {name: 'orders', port: config.port, mongoUri: config.mongoUri});
