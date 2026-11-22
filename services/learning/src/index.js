// Learning service (Pirento Intern): tracks, lessons, the timed final exam, certificates, openings, companies,
// the internship pipeline, and the paid programme (classes, videos, AI-set tasks, paid work).
import {createApp, finish, start} from '@pirento/shared/server';
import {config} from './config.js';
import {internalRoutes} from './routes/internal.routes.js';
import {publicRoutes} from './routes/public.routes.js';
import {lessonRoutes} from './routes/lesson.routes.js';
import {examRoutes} from './routes/exam.routes.js';
import {staffRoutes} from './routes/staff.routes.js';
import {courseRoutes} from './routes/course.routes.js';
import {applicantRoutes} from './routes/applicant.routes.js';
import {openingRoutes} from './routes/opening.routes.js';
import {programRoutes} from './routes/program.routes.js';
import {programStaffRoutes} from './routes/programStaff.routes.js';

const app = createApp('learning');
// examRoutes requires sign-in for everything after it, so it stays last.
app.use(
  internalRoutes,
  publicRoutes,
  lessonRoutes,
  applicantRoutes,
  openingRoutes,
  programRoutes,
  programStaffRoutes,
  courseRoutes,
  staffRoutes,
  examRoutes,
);

start(finish(app), {name: 'learning', port: config.port, mongoUri: config.mongoUri});
