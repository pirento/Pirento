// Green service: Pirento Green's carbon market. Credits bought and sold for wallet money at the price the team sets,
// and credits grown by planted trees (from the orders service's planting records).
import {createApp, finish, requireAuth, start} from '@pirento/shared/server';
import {config} from './config.js';
import {internalRoutes} from './routes/internal.routes.js';
import {marketRoutes} from './routes/market.routes.js';
import {staffRoutes} from './routes/staff.routes.js';
import {tradeRoutes} from './routes/trade.routes.js';

const app = createApp('green');
app.use(internalRoutes, marketRoutes);
app.use(requireAuth);
app.use(staffRoutes, tradeRoutes);

start(finish(app), {name: 'green', port: config.port, mongoUri: config.mongoUri});
