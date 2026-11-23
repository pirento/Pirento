// Called by the auth service when an account is deleted: remove everything this service keeps about it.
import {Router} from 'express';
import {z} from 'zod';
import {requireInternal, validate} from '@pirento/shared/server';
import {Application} from '../models/Application.js';
import {Attempt} from '../models/Attempt.js';
import {Certificate} from '../models/Certificate.js';
import {Employer} from '../models/Employer.js';
import {Opening} from '../models/Opening.js';
import {Progress} from '../models/Progress.js';
import {Resume} from '../models/Resume.js';
import {Assignment} from '../models/Assignment.js';
import {Attendance} from '../models/Attendance.js';
import {Enrolment} from '../models/Enrolment.js';
import {Work} from '../models/Work.js';

export const internalRoutes = Router();
internalRoutes.use('/internal', requireInternal);

internalRoutes.post('/internal/forget', validate(z.object({userId: z.string().min(1).max(40)})), async (req, res) => {
  const {userId} = req.body;
  const employer = await Employer.findOneAndDelete({userId});
  await Promise.all([
    Attempt.deleteMany({userId}),
    Certificate.deleteMany({userId}),
    Application.deleteMany({userId}),
    Resume.deleteMany({userId}),
    Progress.deleteMany({userId}),
    Enrolment.deleteMany({userId}),
    Assignment.deleteMany({userId}),
    Attendance.deleteMany({userId}),

    // A deleted company's openings close; applicants keep their own applications to them.
    employer && Opening.updateMany({employerId: String(employer._id)}, {$set: {open: false}}),
  ]);
  // Paid work stays as a record of what was paid, without who did it or what they wrote; unfinished work reopens.
  // In this order: reopening needs the assignee still set.
  await Work.updateMany(
    {'assignee.userId': userId, status: {$ne: 'approved'}},
    {$set: {status: 'open'}, $unset: {assignee: 1, answer: 1, link: 1, aiReview: 1}},
  );
  await Work.updateMany({'assignee.userId': userId}, {$unset: {assignee: 1, answer: 1, link: 1, aiReview: 1}});
  await Work.updateMany({'suggestion.userId': userId}, {$unset: {suggestion: 1}});
  res.json({data: {forgotten: true}});
});

/** Pirento AI's look at a person's own Pirento Intern: programme and mark, open tasks, applications, certificates. */
internalRoutes.post(
  '/internal/assistant',
  validate(z.object({userId: z.string().min(1).max(40)})),
  async (req, res) => {
    const {userId} = req.body;
    const [enrolment, tasks, apps, certs, work] = await Promise.all([
      Enrolment.findOne({userId}).sort({createdAt: -1}).lean(),
      Assignment.find({userId, status: 'open', due: {$gt: new Date()}}, {title: 1, cadence: 1, due: 1}).lean(),
      Application.find({userId}, {status: 1, openingId: 1, updatedAt: 1}).sort({updatedAt: -1}).limit(10).lean(),
      Certificate.find({userId}, {code: 1, title: 1, track: 1, percent: 1}).lean(),
      Work.find(
        {'assignee.userId': userId, status: {$in: ['assigned', 'redo', 'submitted']}},
        {title: 1, status: 1, pay: 1},
      ).lean(),
    ]);
    res.json({
      data: {
        programme: enrolment && {
          months: enrolment.months,
          status: enrolment.status,
          endsAt: enrolment.endsAt,
          mark: enrolment.score ?? null,
        },
        openTasks: tasks.map((t) => ({title: t.title, cadence: t.cadence, due: t.due})),
        paidWork: work.map((w) => ({title: w.title, status: w.status, rupees: w.pay / 100})),
        applications: apps.map((a) => ({status: a.status, since: a.updatedAt})),
        certificates: certs.map((c) => ({code: c.code, name: c.title ?? c.track, percent: c.percent})),
      },
    });
  },
);

/** Pirento AI's admin answers: programme places, paid work and practice tasks waiting on staff, applications. */
internalRoutes.post('/internal/staff-summary', validate(z.object({}).passthrough()), async (_req, res) => {
  const [places, work, toGrade, apps] = await Promise.all([
    Enrolment.aggregate([{$group: {_id: '$status', n: {$sum: 1}}}]),
    Work.aggregate([{$group: {_id: '$status', n: {$sum: 1}}}]),
    Assignment.countDocuments({status: 'submitted'}),
    Application.aggregate([{$group: {_id: '$status', n: {$sum: 1}}}]),
  ]);
  const map = (rows) => Object.fromEntries(rows.map((r) => [r._id, r.n]));
  res.json({data: {places: map(places), paidWork: map(work), practiceTasksToGrade: toGrade, applications: map(apps)}});
});
