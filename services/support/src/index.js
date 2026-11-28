// Support service: tickets between customers and the Pirento team, the contact form's enquiries, and WhatsApp (the
// bot with Pirento AI, and the team's inbox).
import {createApp, finish, requireAuth, start} from '@pirento/shared/server';
import {config} from './config.js';
import {staffRoutes} from './routes/staff.routes.js';
import {ticketRoutes} from './routes/ticket.routes.js';
import {internalRoutes} from './routes/internal.routes.js';
import {publicEnquiryRoutes, staffEnquiryRoutes} from './routes/enquiry.routes.js';
import {whatsappStaff, whatsappWebhook} from './routes/whatsapp.routes.js';

const app = createApp('support');
// Service-to-service calls carry their own key, not a user's sign-in.
app.use(internalRoutes);
// The contact form takes enquiries from anyone, signed in or not.
app.use(publicEnquiryRoutes);
// Meta's WhatsApp webhook carries its own signature.
app.use(whatsappWebhook);
app.use(requireAuth);
// /staff/queue must be matched before the ticket routes' /:id.
app.use(whatsappStaff, staffRoutes, staffEnquiryRoutes, ticketRoutes);

start(finish(app), {name: 'support', port: config.port, mongoUri: config.mongoUri});
