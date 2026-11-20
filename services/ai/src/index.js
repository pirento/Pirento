// AI service (Pirento AI): a chat assistant on Claude that knows the catalog,
// with saved chats and a daily limit per account.
import {createApp, finish, requireAuth, start} from '@pirento/shared/server';
import {config} from './config.js';
import {internalRoutes} from './routes/internal.routes.js';
import {chatRoutes} from './routes/chat.routes.js';

const app = createApp('ai');
// Internal routes go first: they carry the service key, not a user's token.
app.use(internalRoutes);
app.use(requireAuth);
app.use(chatRoutes);

start(finish(app), {name: 'ai', port: config.port, mongoUri: config.mongoUri});
