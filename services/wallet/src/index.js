// Wallet service: one balance per account, an append-only ledger, and
// idempotent debits and credits for the other services.
import {createApp, finish, start} from '@pirento/shared/server';
import {config} from './config.js';
import {internalRoutes} from './routes/internal.routes.js';
import {walletRoutes} from './routes/wallet.routes.js';
import {staffRoutes} from './routes/staff.routes.js';

const app = createApp('wallet');
// Internal routes go first: they carry their own key, not a user's token.
app.use(internalRoutes, staffRoutes, walletRoutes);

start(finish(app), {name: 'wallet', port: config.port, mongoUri: config.mongoUri});
