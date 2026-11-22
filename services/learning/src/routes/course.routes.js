// Admin → Intern courses: track settings, the question bank and lessons. Every change is audited.
import {Router} from 'express';
import {z} from 'zod';
import {ACCESS, audit, badInput, isId, notFound, requireAuth, requireRole, validate} from '@pirento/shared/server';
import {Lesson} from '../models/Lesson.js';
import {Question} from '../models/Question.js';
import {Track} from '../models/Track.js';
import {allTracks, bankOf, trackOf} from '../lib/bank.js';

export const courseRoutes = Router();
const staff = Router();
staff.use(requireAuth, requireRole(...ACCESS.learning));
courseRoutes.use('/staff/courses', staff);

/** Every track with its settings, bank size and lessons, built-in ones first. */
staff.get('/tracks', async (_req, res) => {
  const [tracks, questions, lessons] = await Promise.all([
    allTracks(),
    Question.aggregate([{$match: {active: true}}, {$group: {_id: '$track', n: {$sum: 1}}}]),
    Lesson.aggregate([{$group: {_id: '$track', n: {$sum: 1}}}]),
  ]);
  const added = Object.fromEntries(questions.map((q) => [q._id, q.n]));
  const lessonCount = Object.fromEntries(lessons.map((l) => [l._id, l.n]));
  const out = await Promise.all(
    tracks.map(async (t) => ({
      ...t,
      bank: (await bankOf(t.slug)).length,
      added: added[t.slug] ?? 0,
      lessons: lessonCount[t.slug] ?? 0,
    })),
  );
  res.json({data: out});
});

const trackBody = z.object({
  name: z.string().trim().min(2).max(80),
  minutes: z.number().int().min(5).max(180),
  passPercent: z.number().int().min(30).max(100),
  questions: z.number().int().min(3).max(100),
  active: z.boolean(),
});

/** Saves a track's settings: a built-in slug is overridden, a new slug becomes a new track. */
staff.put('/tracks/:slug', validate(trackBody), async (req, res) => {
  const slug = String(req.params.slug).toLowerCase();
  if (!/^[a-z0-9-]{2,40}$/.test(slug)) throw badInput('Use 2–40 small letters, digits and dashes for the slug');
  await Track.updateOne({slug}, {$set: {...req.body, slug}}, {upsert: true});
  audit(req, 'course.track', slug, req.body.active ? 'on' : 'off');
  res.json({data: await trackOf(slug)});
});

const optionsAndAnswer = (o) => o.answer < o.options.length;
const questionBody = z
  .object({
    track: z.string().trim().min(2).max(40),
    skill: z.enum(['theoretical', 'practical']),
    question: z.string().trim().min(10).max(500),
    options: z.array(z.string().trim().min(1).max(200)).min(2).max(6),
    answer: z.number().int().min(0).max(5),
    active: z.boolean().default(true),
  })
  .refine(optionsAndAnswer, {message: 'The right answer must be one of the options', path: ['answer']});

/** The questions admin added to a track (built-in ones are fixed in code and not listed). */
staff.get('/questions', async (req, res) => {
  const track = String(req.query.track ?? '');
  res.json({data: await Question.find({track}).sort({createdAt: -1}).limit(500)});
});

staff.post('/questions', validate(questionBody), async (req, res) => {
  if (!(await trackOf(req.body.track))) throw badInput('Save the track first');
  const doc = await Question.create({...req.body, createdBy: req.user.email});
  audit(req, 'course.question.create', req.body.track, req.body.question.slice(0, 60));
  res.status(201).json({data: doc});
});

staff.patch('/questions/:id', validate(questionBody), async (req, res) => {
  const doc = isId(req.params.id) && (await Question.findByIdAndUpdate(req.params.id, req.body, {new: true}));
  if (!doc) throw notFound('Question not found');
  audit(req, 'course.question.update', doc.track, doc.active ? 'on' : 'off');
  res.json({data: doc});
});

const lessonBody = z.object({
  track: z.string().trim().min(2).max(40),
  order: z.number().int().min(1).max(500),
  title: z.string().trim().min(3).max(120),
  body: z.string().trim().min(20, 'Write the lesson').max(20000),
  practice: z
    .array(
      z
        .object({
          question: z.string().trim().min(5).max(500),
          options: z.array(z.string().trim().min(1).max(200)).min(2).max(6),
          answer: z.number().int().min(0).max(5),
          explain: z.string().trim().max(500).default(''),
        })
        .refine(optionsAndAnswer, {message: 'The right answer must be one of the options'}),
    )
    .max(20),
  published: z.boolean(),
});

staff.get('/lessons', async (req, res) => {
  const filter = typeof req.query.track === 'string' && req.query.track ? {track: req.query.track} : {};
  res.json({data: await Lesson.find(filter).sort({track: 1, order: 1}).limit(500)});
});

staff.post('/lessons', validate(lessonBody), async (req, res) => {
  if (!(await trackOf(req.body.track))) throw badInput('Save the track first');
  const doc = await Lesson.create(req.body);
  audit(req, 'course.lesson.create', req.body.track, req.body.title);
  res.status(201).json({data: doc});
});

staff.put('/lessons/:id', validate(lessonBody), async (req, res) => {
  const doc = isId(req.params.id) && (await Lesson.findByIdAndUpdate(req.params.id, req.body, {new: true}));
  if (!doc) throw notFound('Lesson not found');
  audit(req, 'course.lesson.update', doc.track, `${doc.title} (${doc.published ? 'published' : 'draft'})`);
  res.json({data: doc});
});
