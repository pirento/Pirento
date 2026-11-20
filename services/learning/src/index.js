// Learning service (Pirento Intern): tracks, the timed final exam and certificates.
import {createApp, finish, start} from '@pirento/shared/server';
import {config} from './config.js';
import {internalRoutes} from './routes/internal.routes.js';
import {publicRoutes} from './routes/public.routes.js';
import {examRoutes} from './routes/exam.routes.js';
import {staffRoutes} from './routes/staff.routes.js';
import {openingRoutes} from './routes/opening.routes.js';

const app = createApp('learning');
app.use(internalRoutes, publicRoutes, openingRoutes, staffRoutes, examRoutes);

start(finish(app), {name: 'learning', port: config.port, mongoUri: config.mongoUri});
