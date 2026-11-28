// Orders service: checkout, payments (wallet and Razorpay), the staff work
// queue, Pirento One referrals and public completion codes.
import {createApp, finish, start} from '@pirento/shared/server';
import {config} from './config.js';
import {publicRoutes} from './routes/public.routes.js';
import {partnerRoutes} from './routes/partner.routes.js';
import {staffRoutes} from './routes/staff.routes.js';
import {paymentRoutes} from './routes/payment.routes.js';
import {customerRoutes} from './routes/customer.routes.js';
import {couponRoutes} from './routes/coupon.routes.js';
import {internalRoutes} from './routes/internal.routes.js';
import {fileRoutes} from './routes/file.routes.js';
import {aiRoutes} from './routes/ai.routes.js';
import {greenRoutes} from './routes/green.routes.js';
import {shipmentRoutes} from './routes/shipment.routes.js';
import {startShipmentTracker} from './lib/shipments.js';

const app = createApp('orders');
// Order matters: the fixed paths (/partner, /staff) must come before /:id.
app.use(
  internalRoutes,
  aiRoutes,
  greenRoutes, // before staffRoutes, so /staff/green is not read as an order id
  shipmentRoutes, // likewise /staff/shipments
  publicRoutes,
  partnerRoutes,
  couponRoutes,
  staffRoutes,
  fileRoutes,
  paymentRoutes,
  customerRoutes,
);

start(finish(app), {name: 'orders', port: config.port, mongoUri: config.mongoUri});
startShipmentTracker(); // Blue Dart parcels: where each one is, every hour
