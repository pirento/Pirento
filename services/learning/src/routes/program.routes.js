// The intern's side of the paid programme: buy a place, fill the profile, daily/weekly/monthly tasks, live
// classes and recordings, lesson videos, paid work, the final mark, the certificate and an AI resume draft.
import {Router} from 'express';
import {z} from 'zod';
import {httpUrl} from '../lib/urls.js';
import {PROGRAM_MONTHS} from '@pirento/shared';
import {
  ApiError,
  conflict,
  isId,
  isStaff,
  notFound,
  requireAuth,
  requireBharatId,
  validate,
} from '@pirento/shared/server';
import {Assignment} from '../models/Assignment.js';
import {Attendance} from '../models/Attendance.js';
import {Certificate} from '../models/Certificate.js';
import {Enrolment} from '../models/Enrolment.js';
import {Lesson} from '../models/Lesson.js';
import {LiveClass} from '../models/LiveClass.js';
import {Program} from '../models/Program.js';
import {Work} from '../models/Work.js';
import {ask} from '../lib/ai.js';
import {aiReview, buyPlace, currentTasks, eligibility, finish, running, scoreOf} from '../lib/program.js';
import {playUrl} from '../lib/video.js';

export const programRoutes = Router();

/** The four lengths, with a price once a superadmin has put them on sale. */
programRoutes.get('/programs', async (_req, res) => {
  const rows = await Program.find({active: true}).lean();
  res.json({
    data: PROGRAM_MONTHS.map((months) => {
      const p = rows.find((r) => r.months === months);
      return {months, price: p ? p.price : null, onSale: Boolean(p)};
    }),
  });
});

const me = Router();
me.use(['/program', '/classes', '/work', '/lesson-video'], requireAuth);
programRoutes.use(me);

/** The latest place (running or finished), what still blocks paid work, and the mark so far. */
me.get('/program/me', async (req, res) => {
  const enrolment = await Enrolment.findOne({userId: req.user.sub}).sort({createdAt: -1});
  const [elig, score] = await Promise.all([
    eligibility(req.user.sub, enrolment),
    enrolment?.status === 'active' ? scoreOf(enrolment) : enrolment?.score,
  ]);
  res.json({data: {enrolment, ...elig, score: score ?? null}});
});

/** A Bharat ID comes first: every intern on the programme is identified. */
me.post(
  '/program/buy',
  requireBharatId,
  validate(
    z.object({
      months: z
        .number()
        .int()
        .refine((m) => PROGRAM_MONTHS.includes(m), 'Choose 3, 6, 9 or 12'),
    }),
  ),
  async (req, res) => {
    res.status(201).json({data: await buyPlace(req.user, req.body.months)});
  },
);

const profileBody = z.object({
  fullName: z.string().trim().min(2).max(80),
  track: z.string().trim().min(2).max(40),
  skills: z.array(z.string().trim().min(1).max(40)).min(1).max(20),
  education: z.string().trim().max(300).default(''),
  goals: z.string().trim().max(600).default(''),
  bio: z.string().trim().max(1000).default(''),
});

me.put('/program/profile', validate(profileBody), async (req, res) => {
  const doc = await Enrolment.findOneAndUpdate(
    {userId: req.user.sub, status: 'active'},
    {$set: {profile: req.body}},
    {new: true},
  );
  if (!doc) throw notFound('Join a programme first');
  res.json({data: doc});
});

const ownRunning = async (req) => {
  const e = await running(req.user.sub);
  if (!e) throw notFound('Join a programme first');
  return e;
};

/** This period's three tasks (written now if new) and the last ones before them. */
me.get('/program/tasks', async (req, res) => {
  const enrolment = await ownRunning(req);
  if (!enrolment.profile?.track) throw conflict('NO_PROFILE', 'Fill in your profile first, so your tasks fit you');
  const current = await currentTasks(enrolment);
  const ids = current.map((a) => a._id);
  const past = await Assignment.find({enrolmentId: String(enrolment._id), _id: {$nin: ids}})
    .sort({createdAt: -1})
    .limit(30);
  res.json({data: {current, past}});
});

const answerBody = z
  .object({answer: z.string().trim().max(4000).default(''), link: httpUrl().or(z.literal('')).default('')})
  .refine((b) => b.answer || b.link, {message: 'Write your answer or add a link'});

/** Sends a task once, before it is due; the AI grades it at once when it can, else staff do. */
me.post('/program/tasks/:id/submit', validate(answerBody), async (req, res) => {
  const enrolment = await ownRunning(req);
  if (!isId(req.params.id)) throw notFound('Task not found');
  const doc = await Assignment.findOneAndUpdate(
    {_id: req.params.id, userId: req.user.sub, status: 'open', by: {$ne: 'pending'}, due: {$gt: new Date()}},
    {$set: {status: 'submitted', answer: req.body.answer, link: req.body.link, submittedAt: new Date()}},
    {new: true},
  );
  if (!doc) throw conflict('CLOSED', 'This task is closed: already sent, or past its due time');
  const review = await aiReview({title: doc.title, detail: doc.detail}, doc.answer, doc.link, enrolment.profile?.track);
  if (!review) return res.json({data: doc});
  const graded = await Assignment.findOneAndUpdate(
    {_id: doc._id, status: 'submitted'},
    {
      $set: {
        status: 'graded',
        grade: review.grade,
        feedback: review.feedback,
        problems: review.problems,
        reviewLessonIds: review.lessonIds,
        gradedBy: 'ai',
      },
    },
    {new: true},
  );
  res.json({data: graded ?? doc});
});

/** Ends the place once its time is up: fixes the mark and issues the certificate when it passes. */
me.post('/program/finish', async (req, res) => {
  const enrolment = await ownRunning(req);
  if (enrolment.endsAt > new Date()) throw conflict('NOT_YET', 'Your programme is still running');
  res.json({data: await finish(enrolment)});
});

/** A resume draft from the AI, from facts only; once a day. */
me.post('/program/resume', async (req, res) => {
  const startOfDay = new Date(new Date().toISOString().slice(0, 10));
  const enrolment = await Enrolment.findOneAndUpdate(
    {
      userId: req.user.sub,
      'profile.track': {$exists: true},
      $or: [{'resume.at': null}, {'resume.at': {$lt: startOfDay}}],
    },
    {$set: {'resume.at': new Date()}},
    {new: true, sort: {createdAt: -1}},
  );
  if (!enrolment)
    throw new ApiError(429, 'ONCE_A_DAY', 'Fill in your profile first; a new draft can be made once a day');
  const [certs, work] = await Promise.all([
    Certificate.find({userId: req.user.sub}, {title: 1, track: 1, percent: 1, kind: 1}).lean(),
    Work.find({'assignee.userId': req.user.sub, status: 'approved'}, {title: 1, source: 1, grade: 1}).lean(),
  ]);
  const draft = await ask('resume', {
    profile: enrolment.profile,
    certificates: certs.map((c) => ({name: c.title ?? c.track, percent: c.percent, kind: c.kind})),
    work: work.map((w) => ({title: w.title, for: w.source, grade: w.grade})),
    score: enrolment.score ?? null,
  });
  if (!draft) {
    await Enrolment.updateOne({_id: enrolment._id}, {$unset: {'resume.at': 1}});
    throw new ApiError(503, 'AI_OFF', 'The AI could not write a draft right now. Try again later.');
  }
  const resume = {headline: draft.headline, summary: draft.summary, bullets: draft.bullets.slice(0, 8), at: new Date()};
  res.json({data: (await Enrolment.findByIdAndUpdate(enrolment._id, {$set: {resume}}, {new: true})).resume});
});

// ---- Live classes and videos --------------------------------------------------------------------------------

const enrolled = async (req) => {
  const e = await Enrolment.findOne({userId: req.user.sub}).sort({createdAt: -1});
  if (!e && !isStaff(req)) throw new ApiError(403, 'NOT_ENROLLED', 'Join a programme to see classes and videos');
  return e;
};

me.get('/classes', async (req, res) => {
  const e = await enrolled(req);
  const since = new Date(Date.now() - 60 * 86_400_000);
  const classes = await LiveClass.find({startsAt: {$gte: since}, track: {$in: ['', e?.profile?.track ?? '']}})
    .sort({startsAt: 1})
    .lean();
  const went = new Set((await Attendance.find({userId: req.user.sub}, {classId: 1}).lean()).map((a) => a.classId));
  res.json({
    data: classes.map(({recording, link, ...c}) => ({
      ...c,
      attended: went.has(String(c._id)),
      hasRecording: Boolean(recording?.key),
    })),
  });
});

/** The link opens ten minutes before and while the class runs; joining then counts as attending. */
me.post('/classes/:id/join', async (req, res) => {
  const e = await enrolled(req);
  const c = isId(req.params.id) && (await LiveClass.findById(req.params.id).lean());
  if (!c) throw notFound('Class not found');
  const now = Date.now();
  const opens = c.startsAt.getTime() - 10 * 60_000;
  const ends = c.startsAt.getTime() + c.minutes * 60_000;
  if (now < opens) throw conflict('NOT_YET', 'The link opens ten minutes before the class');
  if (now > ends) throw conflict('ENDED', 'This class has ended; watch its recording');
  if (e?.status === 'active') {
    await Attendance.create({classId: String(c._id), userId: req.user.sub}).catch((err) => {
      if (err.code !== 11000) throw err;
    });
  }
  res.json({data: {link: c.link}});
});

me.get('/classes/:id/recording', async (req, res) => {
  await enrolled(req);
  const c = isId(req.params.id) && (await LiveClass.findById(req.params.id).lean());
  if (!c?.recording?.key) throw notFound('No recording yet');
  res.json({data: {url: await playUrl(c.recording.key)}});
});

me.get('/lesson-video/:id', async (req, res) => {
  await enrolled(req);
  const l = isId(req.params.id) && (await Lesson.findOne({_id: req.params.id, published: true}).lean());
  if (!l?.video?.key) throw notFound('This lesson has no video');
  res.json({data: {url: await playUrl(l.video.key)}});
});

// ---- Paid work ----------------------------------------------------------------------------------------------

me.get('/work/mine', async (req, res) => {
  res.json({data: await Work.find({'assignee.userId': req.user.sub}).sort({updatedAt: -1}).limit(100)});
});

/** Sends assigned work; the AI's review is attached for the intern and for staff, who decide and pay. */
me.post('/work/:id/submit', validate(answerBody), async (req, res) => {
  if (!isId(req.params.id)) throw notFound('Work not found');
  const doc = await Work.findOneAndUpdate(
    {_id: req.params.id, 'assignee.userId': req.user.sub, status: {$in: ['assigned', 'redo']}},
    {$set: {status: 'submitted', answer: req.body.answer, link: req.body.link, submittedAt: new Date()}},
    {new: true},
  );
  if (!doc) throw conflict('NOT_YOURS', 'This work is not waiting on you');
  const review = await aiReview({title: doc.title, detail: doc.brief}, doc.answer, doc.link, doc.track);
  res.json({
    data: review ? await Work.findByIdAndUpdate(doc._id, {$set: {aiReview: review}}, {new: true}) : doc,
  });
});
