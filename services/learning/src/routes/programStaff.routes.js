// Admin side of the paid programme: prices (superadmin), enrolments, live classes, videos, grading practice tasks,
// and paid work from across Pirento: the AI suggests an intern, staff assign, review, and approval pays the wallet.
import {Router} from 'express';
import {z} from 'zod';
import {httpUrl} from '../lib/urls.js';
import {PROGRAM_MONTHS} from '@pirento/shared';
import {
  ACCESS,
  audit,
  badInput,
  callService,
  conflict,
  env,
  isId,
  notFound,
  notify,
  requireAuth,
  requireRole,
  searchFilter,
  validate,
} from '@pirento/shared/server';
import {Assignment} from '../models/Assignment.js';
import {Enrolment} from '../models/Enrolment.js';
import {Lesson} from '../models/Lesson.js';
import {LiveClass} from '../models/LiveClass.js';
import {Program} from '../models/Program.js';
import {Work} from '../models/Work.js';
import {ask} from '../lib/ai.js';
import {eligibility, finish, scoreOf} from '../lib/program.js';
import {MAX_VIDEO_BYTES, uploadUrl, videoReady, videoUploaded} from '../lib/video.js';

export const programStaffRoutes = Router();
const staff = Router();
staff.use(requireAuth, requireRole(...ACCESS.openings));
programStaffRoutes.use('/staff/program', staff);

const WALLET_URL = env('WALLET_URL', 'http://127.0.0.1:4002');
const BRAND = 'Pirento Intern';

// ---- Prices ---------------------------------------------------------------------------------------------------

staff.get('/programs', async (_req, res) => {
  const rows = await Program.find().lean();
  res.json({data: PROGRAM_MONTHS.map((months) => rows.find((r) => r.months === months) ?? {months, price: null})});
});

staff.put(
  '/programs/:months',
  requireRole(...ACCESS.catalog),
  validate(z.object({price: z.number().int().min(0).max(10_000_000_00), active: z.boolean()})),
  async (req, res) => {
    const months = Number(req.params.months);
    if (!PROGRAM_MONTHS.includes(months)) throw badInput('Choose 3, 6, 9 or 12 months');
    const doc = await Program.findOneAndUpdate({months}, {$set: req.body}, {upsert: true, new: true});
    audit(req, 'program.price', `${months} months`, `₹${req.body.price / 100}${req.body.active ? '' : ' (off sale)'}`);
    res.json({data: doc});
  },
);

// ---- Enrolments -----------------------------------------------------------------------------------------------

staff.get('/enrolments', async (req, res) => {
  const filter = {...searchFilter(req.query.q, null, ['email', 'profile.fullName'])};
  if (req.query.status === 'active' || req.query.status === 'finished') filter.status = req.query.status;
  res.json({data: await Enrolment.find(filter, {resume: 0}).sort({createdAt: -1}).limit(300)});
});

staff.get('/enrolments/:id', async (req, res) => {
  const e = isId(req.params.id) && (await Enrolment.findById(req.params.id));
  if (!e) throw notFound('Enrolment not found');
  const [score, tasks, work] = await Promise.all([
    e.status === 'active' ? scoreOf(e) : e.score,
    Assignment.find({enrolmentId: String(e._id)})
      .sort({createdAt: -1})
      .limit(60),
    Work.find({'assignee.userId': e.userId}).sort({updatedAt: -1}).limit(60),
  ]);
  res.json({data: {enrolment: e, score, tasks, work}});
});

/** Ends a place early (or on time), fixing the mark and issuing the certificate when it passes. */
staff.post('/enrolments/:id/finish', async (req, res) => {
  const e = isId(req.params.id) && (await Enrolment.findOne({_id: req.params.id, status: 'active'}));
  if (!e) throw notFound('No running enrolment here');
  const done = await finish(e);
  audit(req, 'program.finish', e.email, `${done.score.total}% ${done.score.grade}`);
  notify(e.userId, {
    brand: BRAND,
    label: `${e.months}-month programme`,
    big: `Finished · ${done.score.total}%`,
    note: done.certificateCode
      ? `Your certificate ${done.certificateCode} is ready.`
      : 'Open Pirento Intern to see your mark.',
  });
  res.json({data: done});
});

// ---- Practice tasks the AI could not grade ----------------------------------------------------------------------

staff.get('/tasks', async (req, res) => {
  const status = ['submitted', 'graded'].includes(req.query.status) ? req.query.status : 'submitted';
  res.json({data: await Assignment.find({status}).sort({submittedAt: 1}).limit(200)});
});

staff.patch(
  '/tasks/:id',
  validate(z.object({grade: z.number().int().min(0).max(100), feedback: z.string().trim().max(2000).default('')})),
  async (req, res) => {
    const doc =
      isId(req.params.id) &&
      (await Assignment.findOneAndUpdate(
        {_id: req.params.id, status: {$in: ['submitted', 'graded']}},
        {$set: {...req.body, status: 'graded', gradedBy: req.user.email}},
        {new: true},
      ));
    if (!doc) throw notFound('No sent task here');
    audit(req, 'program.task.grade', doc.title, `${doc.grade}`);
    notify(doc.userId, {brand: BRAND, label: doc.title, big: `Graded · ${doc.grade}/100`, note: doc.feedback});
    res.json({data: doc});
  },
);

// ---- Live classes and videos --------------------------------------------------------------------------------------

const classBody = z.object({
  track: z.string().trim().max(40).default(''),
  title: z.string().trim().min(3).max(120),
  about: z.string().trim().max(1000).default(''),
  startsAt: z.coerce.date(),
  minutes: z.number().int().min(10).max(600),
  link: httpUrl('Paste the Meet or Zoom link'),
});

staff.get('/classes', async (_req, res) => {
  res.json({data: await LiveClass.find().sort({startsAt: -1}).limit(200)});
});

staff.post('/classes', validate(classBody), async (req, res) => {
  const doc = await LiveClass.create({...req.body, createdBy: req.user.email});
  audit(req, 'program.class', doc.title);
  res.status(201).json({data: doc});
});

staff.patch('/classes/:id', validate(classBody.partial()), async (req, res) => {
  const doc = isId(req.params.id) && (await LiveClass.findByIdAndUpdate(req.params.id, {$set: req.body}, {new: true}));
  if (!doc) throw notFound('Class not found');
  audit(req, 'program.class.update', doc.title);
  res.json({data: doc});
});

const videoBody = z.object({
  name: z.string().trim().min(1).max(200),
  type: z.string().max(100),
  size: z.number().int().positive().max(MAX_VIDEO_BYTES, 'A video can be at most 2 GB'),
});

staff.get('/video-ready', (_req, res) => res.json({data: {ready: videoReady()}}));

// The upload URL comes first and the video is only attached once the browser says it finished and the bucket
// has it, so a failed or abandoned upload never replaces a working video.
const FIELD = (Model) => (Model === LiveClass ? 'recording' : 'video');
const PENDING = (Model) => (Model === LiveClass ? 'pendingRecording' : 'pendingVideo');

async function startVideo(req, Model, folder) {
  const doc = isId(req.params.id) && (await Model.findById(req.params.id));
  if (!doc) throw notFound('Not found');
  const {key, url} = await uploadUrl(folder, req.body.type);
  await Model.updateOne({_id: doc._id}, {$set: {[PENDING(Model)]: {key, ...req.body}}});
  return {url, type: req.body.type};
}

async function confirmVideo(req, Model) {
  const doc = isId(req.params.id) && (await Model.findById(req.params.id));
  const pending = doc?.[PENDING(Model)];
  if (!pending?.key) throw notFound('No upload to confirm');
  if (!(await videoUploaded(pending.key))) throw conflict('NOT_UPLOADED', 'The upload has not reached storage');
  // Conditional on the same pending key, so a newer upload started meanwhile is not overwritten.
  const done = await Model.findOneAndUpdate(
    {_id: doc._id, [`${PENDING(Model)}.key`]: pending.key},
    {$set: {[FIELD(Model)]: pending}, $unset: {[PENDING(Model)]: 1}},
    {new: true},
  );
  if (!done) throw conflict('CHANGED', 'A newer upload replaced this one');
  audit(req, `program.${FIELD(Model)}`, doc.title, pending.name);
  return {[FIELD(Model)]: done[FIELD(Model)]};
}

staff.post('/classes/:id/recording', validate(videoBody), async (req, res) => {
  res.json({data: await startVideo(req, LiveClass, 'classes')});
});
staff.post('/classes/:id/recording/confirm', async (req, res) => {
  res.json({data: await confirmVideo(req, LiveClass)});
});

const lessonVideo = Router({mergeParams: true}); // keeps :id from the mount path
lessonVideo.use(requireAuth, requireRole(...ACCESS.learning));
lessonVideo.post('/', validate(videoBody), async (req, res) =>
  res.json({data: await startVideo(req, Lesson, 'lessons')}),
);
lessonVideo.post('/confirm', async (req, res) => res.json({data: await confirmVideo(req, Lesson)}));
programStaffRoutes.use('/staff/courses/lessons/:id/video', lessonVideo);

// ---- Paid work ------------------------------------------------------------------------------------------------------

const workBody = z.object({
  title: z.string().trim().min(3).max(120),
  brief: z.string().trim().min(20, 'Describe the work').max(4000),
  source: z.string().trim().min(2).max(60),
  track: z.string().trim().max(40).default(''),
  skills: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  pay: z.number().int().min(0).max(10_000_000), // paise
  due: z.coerce.date().optional(),
});

staff.get('/work', async (req, res) => {
  const filter = {...searchFilter(req.query.q, null, ['title', 'source', 'assignee.email'])};
  if (typeof req.query.status === 'string' && req.query.status) filter.status = req.query.status;
  res.json({data: await Work.find(filter).sort({updatedAt: -1}).limit(300)});
});

staff.post('/work', validate(workBody), async (req, res) => {
  const doc = await Work.create({...req.body, createdBy: req.user.email});
  audit(req, 'work.create', doc.title, `₹${doc.pay / 100}`);
  res.status(201).json({data: doc});
});

/** Interns who may take paid work now: running place, Bharat ID, a passed exam and a profile. */
async function candidates(limit = 40) {
  const running = await Enrolment.find({status: 'active', 'profile.track': {$exists: true}})
    .sort({updatedAt: -1})
    .limit(limit)
    .lean();
  const out = [];
  for (const e of running) {
    const {eligible} = await eligibility(e.userId, e);
    if (!eligible) continue;
    const [done, busy] = await Promise.all([
      Work.find({'assignee.userId': e.userId, status: 'approved'}, {grade: 1}).lean(),
      Work.countDocuments({'assignee.userId': e.userId, status: {$in: ['assigned', 'submitted', 'redo']}}),
    ]);
    const grades = done.map((w) => w.grade ?? 0);
    out.push({
      enrolment: e,
      facts: {
        candidateId: e.userId,
        track: e.profile.track,
        skills: e.profile.skills,
        averageGrade: grades.length ? Math.round(grades.reduce((a, b) => a + b, 0) / grades.length) : null,
        jobsDone: done.length,
        jobsRunning: busy,
      },
    });
  }
  return out;
}

/** The AI picks the best eligible intern and says why; without the AI, a plain rule picks. Staff then confirm. */
staff.post('/work/:id/suggest', async (req, res) => {
  const work = isId(req.params.id) && (await Work.findOne({_id: req.params.id, status: 'open'}));
  if (!work) throw notFound('Only open work gets a suggestion');
  const pool = await candidates();
  if (!pool.length) throw conflict('NO_ONE', 'No intern is eligible for paid work yet');
  const ai = await ask('match', {
    work: {title: work.title, brief: work.brief.slice(0, 1500), track: work.track, skills: work.skills},
    candidates: pool.map((p) => p.facts),
  });
  let pick = ai && pool.find((p) => p.facts.candidateId === ai.candidateId);
  let reason = pick ? ai.reason.slice(0, 500) : '';
  let by = 'ai';
  if (!pick) {
    // Same track first, then the best average grade, then the fewest jobs running.
    const score = (p) =>
      (p.facts.track === work.track ? 1000 : 0) + (p.facts.averageGrade ?? 50) - p.facts.jobsRunning * 10;
    pick = [...pool].sort((a, b) => score(b) - score(a))[0];
    reason = 'Picked by rule: same track first, then best average grade, then fewest jobs running.';
    by = 'rule';
  }
  const suggestion = {
    userId: pick.facts.candidateId,
    name: pick.enrolment.profile.fullName,
    reason,
    by,
    at: new Date(),
  };
  res.json({data: await Work.findByIdAndUpdate(work._id, {$set: {suggestion}}, {new: true})});
});

staff.post('/work/:id/assign', validate(z.object({userId: z.string().min(1).max(40)})), async (req, res) => {
  const e = await Enrolment.findOne({userId: req.body.userId, status: 'active'}).lean();
  if (!e || !(await eligibility(e.userId, e)).eligible)
    throw conflict('NOT_ELIGIBLE', 'This intern cannot take paid work yet');
  const doc =
    isId(req.params.id) &&
    (await Work.findOneAndUpdate(
      {_id: req.params.id, status: 'open'},
      {$set: {status: 'assigned', assignee: {userId: e.userId, email: e.email, name: e.profile.fullName}}},
      {new: true},
    ));
  if (!doc) throw conflict('TAKEN', 'This work is no longer open');
  audit(req, 'work.assign', doc.title, e.email);
  notify(e.userId, {
    brand: BRAND,
    label: doc.title,
    big: 'New paid work for you',
    note: `₹${doc.pay / 100} on approval. Open Pirento Intern → Work.`,
  });
  res.json({data: doc});
});

/** Pays approved work into the intern's wallet. The ref makes a retry pay once. */
async function pay(work) {
  if (!work.pay) return Work.findByIdAndUpdate(work._id, {$set: {paid: true}}, {new: true});
  await callService(WALLET_URL, '/internal/credit', {
    userId: work.assignee.userId,
    amount: work.pay,
    ref: `intern-work-${work._id}`,
    note: `Pirento Intern · ${work.title}`.slice(0, 140),
  });
  return Work.findByIdAndUpdate(work._id, {$set: {paid: true}}, {new: true});
}

staff.patch(
  '/work/:id/review',
  validate(
    z.object({
      status: z.enum(['approved', 'redo']),
      grade: z.number().int().min(0).max(100),
      feedback: z.string().trim().max(2000).default(''),
    }),
  ),
  async (req, res) => {
    const doc =
      isId(req.params.id) &&
      (await Work.findOneAndUpdate(
        {_id: req.params.id, status: 'submitted'},
        {$set: {...req.body, ...(req.body.status === 'approved' && {approvedBy: req.user.email})}},
        {new: true},
      ));
    if (!doc) throw conflict('NOT_SUBMITTED', 'This work is not waiting for review');
    audit(req, `work.${req.body.status}`, doc.title, `${req.body.grade}`);
    let out = doc;
    if (req.body.status === 'approved') {
      // A failed credit stays owed (paid: false) and "Pay again" sends it; the approval stands.
      out = await pay(doc).catch((err) => (console.error('work pay', doc._id, err.message), doc));
    }
    notify(doc.assignee.userId, {
      brand: BRAND,
      label: doc.title,
      big: req.body.status === 'approved' ? `Approved · ₹${doc.pay / 100} to your wallet` : 'Needs another go',
      note: req.body.feedback,
    });
    res.json({data: out});
  },
);

staff.post('/work/:id/pay', async (req, res) => {
  const doc = isId(req.params.id) && (await Work.findOne({_id: req.params.id, status: 'approved', paid: false}));
  if (!doc) throw notFound('Nothing owed on this work');
  const out = await pay(doc);
  audit(req, 'work.pay', doc.title, `₹${doc.pay / 100}`);
  res.json({data: out});
});
