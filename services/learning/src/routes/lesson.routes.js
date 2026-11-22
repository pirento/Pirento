// Lessons: anyone reads the published ones; signed-in learners check their practice answers and keep progress.
import {Router} from 'express';
import {z} from 'zod';
import {isId, notFound, requireAuth, validate} from '@pirento/shared/server';
import {Lesson} from '../models/Lesson.js';
import {Progress} from '../models/Progress.js';

export const lessonRoutes = Router();

lessonRoutes.get('/lessons', async (req, res) => {
  const filter = {published: true};
  if (typeof req.query.track === 'string' && req.query.track) filter.track = req.query.track;
  const rows = await Lesson.find(filter, {body: 0}).sort({track: 1, order: 1}).lean();
  res.json({
    data: rows.map(({practice, video, ...l}) => ({...l, practice: practice.length, hasVideo: Boolean(video?.key)})),
  });
});

lessonRoutes.get('/lessons/progress', requireAuth, async (req, res) => {
  res.json({data: await Progress.find({userId: req.user.sub}, {lessonId: 1, track: 1, doneAt: 1})});
});

/** The lesson to read, with its practice questions but not their answers. */
lessonRoutes.get('/lessons/:id', async (req, res) => {
  const lesson = isId(req.params.id) && (await Lesson.findOne({_id: req.params.id, published: true}).lean());
  if (!lesson) throw notFound('Lesson not found');
  const {video, ...rest} = lesson; // the storage key stays here; enrolled interns ask /lesson-video/:id to play it
  res.json({
    data: {
      ...rest,
      hasVideo: Boolean(video?.key),
      practice: lesson.practice.map(({question, options}) => ({question, options})),
    },
  });
});

/** Marks practice answers ([optionIndex, ...]); all right once and the lesson counts as done. */
lessonRoutes.post(
  '/lessons/:id/check',
  requireAuth,
  validate(z.object({answers: z.array(z.number().int().min(-1).max(9)).max(20)})),
  async (req, res) => {
    const lesson = isId(req.params.id) && (await Lesson.findOne({_id: req.params.id, published: true}).lean());
    if (!lesson) throw notFound('Lesson not found');
    // Practice, not the exam: after an answer the right one and the reason are shown, so people learn.
    const results = lesson.practice.map((q, i) => ({
      correct: req.body.answers[i] === q.answer,
      answer: q.answer,
      explain: q.explain,
    }));
    const done = results.every((r) => r.correct);
    if (done) {
      await Progress.updateOne(
        {userId: req.user.sub, lessonId: String(lesson._id)},
        {$setOnInsert: {track: lesson.track, doneAt: new Date()}},
        {upsert: true},
      ).catch((err) => {
        if (err.code !== 11000) throw err; // two checks at once: the first one counted
      });
    }
    res.json({data: {results, done}});
  },
);
