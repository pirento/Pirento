// Support service: tickets between customers and the Pirento team.
import {createApp, finish, requireAuth, start} from '@pirento/shared/server';
import {config} from './config.js';
import {staffRoutes} from './routes/staff.routes.js';
import {ticketRoutes} from './routes/ticket.routes.js';
import {internalRoutes} from './routes/internal.routes.js';

const app = createApp('support');
// Service-to-service calls carry their own key, not a user's sign-in.
app.use(internalRoutes);
app.use(requireAuth);
// /staff/queue must be matched before the ticket routes' /:id.
app.use(staffRoutes, ticketRoutes);

start(finish(app), {name: 'support', port: config.port, mongoUri: config.mongoUri});
