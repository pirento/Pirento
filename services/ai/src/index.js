// AI service (Pirento AI): an assistant on Claude that knows the catalog and the team's knowledge base, reads a
// person's own account across Pirento through a tool, with saved chats, a daily allowance and paid plans; plus
// one-shot jobs for the other services (Intern tasks and reviews, support reply drafts).
import {createApp, finish, requireAuth, start} from '@pirento/shared/server';
import {config} from './config.js';
import {internalRoutes} from './routes/internal.routes.js';
import {chatRoutes} from './routes/chat.routes.js';
import {staffRoutes} from './routes/staff.routes.js';

// A chat message may carry one PDF or photo (5 MB, base64), so bodies here can be larger than elsewhere.
const app = createApp('ai', {jsonLimit: '8mb'});
// Internal routes go first: they carry the service key, not a user's token.
app.use(internalRoutes, staffRoutes);
app.use(requireAuth);
app.use(chatRoutes);

start(finish(app), {name: 'ai', port: config.port, mongoUri: config.mongoUri});
