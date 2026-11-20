// AI service (Pirento AI): a chat assistant on Claude that knows the catalog,
// with saved chats and a daily limit per account.
import {createApp, finish, requireAuth, start} from '@pirento/shared/server';
import {config} from './config.js';
import {chatRoutes} from './routes/chat.routes.js';

const app = createApp('ai');
app.use(requireAuth);
app.use(chatRoutes);

start(finish(app), {name: 'ai', port: config.port, mongoUri: config.mongoUri});
