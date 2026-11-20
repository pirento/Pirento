// Vault service: files and passwords, encrypted at rest with AES-256-GCM.
// Pirento holds the key, so this is not end-to-end encryption.
import {createApp, finish, requireAuth, start} from '@pirento/shared/server';
import {config} from './config.js';
import {internalRoutes} from './routes/internal.routes.js';
import {fileRoutes} from './routes/file.routes.js';
import {credentialRoutes} from './routes/credential.routes.js';

const app = createApp('vault');
// Internal routes go first: they carry the service key, not a user's token.
app.use(internalRoutes);
app.use(requireAuth); // everything in the vault belongs to someone
app.use(fileRoutes, credentialRoutes);

start(finish(app), {name: 'vault', port: config.port, mongoUri: config.mongoUri});
