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
