// The team's side of the internship pipeline, used twice: staff see every application, a company only those on
// its own openings. `scope(req)` gives that filter. Every move is conditional on the status it was read in.
import {Router} from 'express';
import {z} from 'zod';
import {audit, conflict, isId, isStaff, notFound, notify, searchFilter, validate} from '@pirento/shared/server';
import {Application} from '../models/Application.js';
import {Certificate} from '../models/Certificate.js';
import {Opening} from '../models/Opening.js';
import {Resume} from '../models/Resume.js';
import {TEAM_MOVES, canMove, tasksDone} from '../lib/pipeline.js';
import {newCertificateCode} from '../lib/certificate.js';
import {sendFile} from '../lib/files.js';

const BRAND = 'Pirento Intern';
const DASH = 'Open Pirento Intern → Internships to see it.';
const when = (d) => d.toLocaleString('en-IN', {timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short'});

/** What each move tells the applicant. */
const NOTICE = {
  shortlisted: () => ['You are shortlisted', 'The team liked your application. Next comes an interview or an offer.'],
  interview: (a) => [
    'Interview set',
    `${when(a.interview.at)}${a.interview.link ? ` · ${a.interview.link}` : ''}. ${DASH}`,
  ],
  offered: () => ['You have an offer', `Accept or decline it from your dashboard. ${DASH}`],
  declined: () => ['Not this time', 'Thank you for applying. Other openings are on Pirento Intern.'],
  completed: (a) => ['Internship complete', `Your certificate ${a.certificateCode} is ready. ${DASH}`],
};

const moveBody = z.object({
  to: z.enum(['shortlisted', 'interview', 'offered', 'declined', 'completed']),
  interview: z
    .object({
      at: z.coerce.date(),
      link: z.string().trim().max(300).default(''),
      note: z.string().trim().max(500).default(''),
    })
    .optional(),
  offer: z
    .object({
      start: z.coerce.date(),
      weeks: z.number().int().min(1).max(52),
      stipend: z.string().trim().max(60).default(''),
      note: z.string().trim().max(1000).default(''),
    })
    .optional(),
});

export function teamRoutes(scope) {
  const r = Router();
  const one = async (req) => {
    const doc = isId(req.params.id) && (await Application.findOne({_id: req.params.id, ...scope(req)}));
    if (!doc) throw notFound('Application not found');
    return doc;
  };
  const log = (req, action, a, extra) => isStaff(req) && audit(req, action, a.email, extra);

  /** The queue: newest first, by status or opening, searchable by email or name. */
  r.get('/', async (req, res) => {
    const filter = {...scope(req), ...searchFilter(req.query.q, null, ['email', 'fullName'])};
    if (typeof req.query.status === 'string' && req.query.status) filter.status = req.query.status;
    if (typeof req.query.openingId === 'string' && isId(req.query.openingId)) filter.openingId = req.query.openingId;
    const apps = await Application.find(filter).sort({updatedAt: -1}).limit(300).lean();
    const openings = await Opening.find({_id: {$in: apps.map((a) => a.openingId)}}, {title: 1, company: 1}).lean();
    const byId = Object.fromEntries(openings.map((o) => [String(o._id), o]));
    const withResume = new Set(
      (await Resume.find({userId: {$in: apps.map((a) => a.userId)}}, {userId: 1}).lean()).map((x) => x.userId),
    );
    res.json({
      data: apps.map((a) => ({...a, opening: byId[a.openingId] ?? null, hasResume: withResume.has(a.userId)})),
    });
  });

  r.get('/:id/resume', async (req, res) => {
    const app = await one(req);
    const file = await Resume.findOne({userId: app.userId});
    if (!file) throw notFound('This applicant has no resume on file');
    log(req, 'application.resume', app);
    await sendFile(res, file);
  });

  r.post('/:id/move', validate(moveBody), async (req, res) => {
    const app = await one(req);
    const {to} = req.body;
    if (!canMove(TEAM_MOVES, app.status, to))
      throw conflict('BAD_MOVE', `An application that is ${app.status} cannot become ${to}`);
    const set = {status: to};
    if (to === 'interview') {
      if (!req.body.interview) throw conflict('NEEDS_TIME', 'Set the interview time');
      set.interview = req.body.interview;
    }
    if (to === 'offered') {
      if (!req.body.offer) throw conflict('NEEDS_OFFER', 'Set the start date and length');
      set.offer = req.body.offer;
    }
    if (to === 'completed') {
      if (!tasksDone(app.tasks)) throw conflict('TASKS_OPEN', 'Approve every task before completing the internship');
      const opening = await Opening.findById(app.openingId).lean();
      // One certificate per internship: its track is the application, so a repeat finds the first one.
      const track = `internship-${app._id}`;
      const cert =
        (await Certificate.findOne({userId: app.userId, track})) ??
        (await Certificate.create({
          code: newCertificateCode(),
          kind: 'internship',
          userId: app.userId,
          fullName: app.fullName ?? app.email,
          track,
          title: opening?.title ?? 'Internship',
          company: opening?.company ?? 'Pirento',
          weeks: app.offer?.weeks,
        }));
      Object.assign(set, {completedAt: new Date(), certificateCode: cert.code});
    }
    const doc = await Application.findOneAndUpdate(
      {_id: app._id, status: app.status},
      {$set: set, $push: {history: {status: to, by: req.user.email}}},
      {new: true},
    );
    if (!doc) throw conflict('CHANGED', 'Someone else moved this application. Reload and try again.');
    log(req, `application.${to}`, doc);
    const [big, note] = NOTICE[to](doc);
    notify(doc.userId, {brand: BRAND, label: 'Your application', big, note});
    res.json({data: doc});
  });

  r.post(
    '/:id/tasks',
    validate(
      z.object({
        title: z.string().trim().min(3).max(120),
        detail: z.string().trim().max(2000).default(''),
        due: z.coerce.date().optional(),
      }),
    ),
    async (req, res) => {
      const app = await one(req);
      const doc = await Application.findOneAndUpdate(
        {_id: app._id, status: 'accepted'},
        {$push: {tasks: req.body}},
        {new: true},
      );
      if (!doc) throw conflict('NOT_RUNNING', 'Tasks are set only while the internship is running');
      log(req, 'application.task', doc, req.body.title);
      notify(doc.userId, {
        brand: BRAND,
        label: 'Your internship',
        big: 'A new task',
        note: `${req.body.title}. ${DASH}`,
      });
      res.status(201).json({data: doc});
    },
  );

  r.patch(
    '/:id/tasks/:taskId',
    validate(z.object({status: z.enum(['approved', 'redo']), feedback: z.string().trim().max(1000).default('')})),
    async (req, res) => {
      const app = await one(req);
      if (!isId(req.params.taskId)) throw notFound('Task not found');
      const doc = await Application.findOneAndUpdate(
        {_id: app._id, status: 'accepted', tasks: {$elemMatch: {_id: req.params.taskId, status: 'submitted'}}},
        {$set: {'tasks.$.status': req.body.status, 'tasks.$.feedback': req.body.feedback}},
        {new: true},
      );
      if (!doc) throw conflict('NOT_SUBMITTED', 'This task is not waiting for review');
      const task = doc.tasks.id(req.params.taskId);
      log(req, `application.task.${req.body.status}`, doc, task.title);
      notify(doc.userId, {
        brand: BRAND,
        label: 'Your internship',
        big: req.body.status === 'approved' ? 'Task approved' : 'Task needs another go',
        note: `${task.title}${req.body.feedback ? `: ${req.body.feedback}` : ''}`,
      });
      res.json({data: doc});
    },
  );

  return r;
}
