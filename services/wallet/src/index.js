// Wallet service: one balance per account, an append-only ledger, and
// idempotent debits and credits for the other services.
import {createApp, finish, start} from '@pirento/shared/server';
import {config} from './config.js';
import {internalRoutes} from './routes/internal.routes.js';
import {walletRoutes} from './routes/wallet.routes.js';
import {staffRoutes} from './routes/staff.routes.js';
import {withdrawalRoutes} from './routes/withdrawal.routes.js';
import {payoutRoutes} from './routes/payout.routes.js';
import {topupRoutes} from './routes/topup.routes.js';
import {Withdrawal} from './models/Withdrawal.js';

const app = createApp('wallet');
// Internal routes go first: they carry their own key, not a user's token.
// The webhooks in payoutRoutes and topupRoutes are signed by Razorpay instead.
app.use(internalRoutes, payoutRoutes, topupRoutes, staffRoutes, withdrawalRoutes, walletRoutes);

await start(finish(app), {name: 'wallet', port: config.port, mongoUri: config.mongoUri});
// Requests made before the `open` flag existed get it, then the indexes match the schema (the old one-open index goes).
await Withdrawal.updateMany({status: 'requested', open: {$exists: false}}, {$set: {open: true}});
await Withdrawal.syncIndexes();
