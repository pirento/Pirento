// Vault service: records, files and passwords, encrypted at rest with AES-256-GCM (Pirento holds the key, so this is
// not end-to-end encryption), every opening and change confirmed with the owner's Bharat ID PIN, and the legacy plan
// that releases chosen items to the owner's nominee after a verified death.
import {createApp, finish, requireAuth, requireBharatId, start} from '@pirento/shared/server';
import {config} from './config.js';
import {internalRoutes} from './routes/internal.routes.js';
import {publicRoutes} from './routes/public.routes.js';
import {staffRoutes} from './routes/staff.routes.js';
import {fileRoutes} from './routes/file.routes.js';
import {credentialRoutes} from './routes/credential.routes.js';
import {recordRoutes} from './routes/record.routes.js';
import {legacyRoutes} from './routes/legacy.routes.js';
import {linkRoutes} from './routes/link.routes.js';
import {webhookRoutes} from './routes/webhook.routes.js';
import {startLinkRefresh} from './lib/aa.js';
import {startExpiryReminders} from './lib/expiry.js';
import {markSeen, startCheckins} from './lib/checkin.js';

const app = createApp('vault');
// Internal routes carry the service key, public ones a link's token, staff ones a staff role, the webhook Digio's
// signature: none needs a Bharat ID.
app.use(internalRoutes, publicRoutes, staffRoutes, webhookRoutes);
app.use(requireAuth, requireBharatId); // everything else belongs to someone with an issued Bharat ID
// Any use of the vault is a sign of life for the legacy plan's check-in.
app.use((req, _res, next) => {
  markSeen(req.user.sub).catch((err) => console.error('vault seen', err.message));
  next();
});
app.use(fileRoutes, credentialRoutes, recordRoutes, legacyRoutes, linkRoutes);

start(finish(app), {name: 'vault', port: config.port, mongoUri: config.mongoUri});
startExpiryReminders(); // an email 30 days before a stored document expires
startCheckins(); // the legacy plan's reminders, then the team's call to the nominee
startLinkRefresh(); // linked accounts: a daily check through Digio's Account Aggregator
