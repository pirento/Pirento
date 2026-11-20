// Support service: tickets between customers and the Pirento team.
import {createApp, finish, requireAuth, start} from '@pirento/shared/server';
import {config} from './config.js';
import {staffRoutes} from './routes/staff.routes.js';
import {ticketRoutes} from './routes/ticket.routes.js';

const app = createApp('support');
app.use(requireAuth);
// /staff/queue must be matched before the ticket routes' /:id.
app.use(staffRoutes, ticketRoutes);

start(finish(app), {name: 'support', port: config.port, mongoUri: config.mongoUri});
