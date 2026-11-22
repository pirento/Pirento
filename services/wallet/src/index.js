// Wallet service: one balance per account, an append-only ledger, and idempotent debits and credits for the
// other services. Its data lives in PostgreSQL (lib/db.js), where money moves in SQL transactions.
import {createApp, finish, start} from '@pirento/shared/server';
import {config} from './config.js';
import {migrate, query} from './lib/db.js';
import {internalRoutes} from './routes/internal.routes.js';
import {walletRoutes} from './routes/wallet.routes.js';
import {staffRoutes} from './routes/staff.routes.js';
import {withdrawalRoutes} from './routes/withdrawal.routes.js';
import {payoutRoutes} from './routes/payout.routes.js';
import {topupRoutes} from './routes/topup.routes.js';

const app = createApp('wallet', {ready: () => query('SELECT 1')});
// Internal routes go first: they carry their own key, not a user's token.
// The webhooks in payoutRoutes and topupRoutes are signed by Razorpay instead.
app.use(internalRoutes, payoutRoutes, topupRoutes, staffRoutes, withdrawalRoutes, walletRoutes);

await migrate();
await start(finish(app), {name: 'wallet', port: config.port});
