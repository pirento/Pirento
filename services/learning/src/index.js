import crypto from 'node:crypto';
import mongoose from 'mongoose';
import {z} from 'zod';
import {TRACKS, bankForSlug} from '@pirento/shared/exam';
import {ApiError, asyncHandler, createApp, env, finish, requireAuth, start, validate} from '@pirento/shared/server';
import {EXAM_MINUTES, publicQuestions, score, withinTime} from './exam.js';

const RETRY_HOURS = 24;

const Attempt = mongoose.model(
  'Attempt',
  new mongoose.Schema({
    userId: {type: String, required: true, index: true},
    track: {type: String, required: true},
    fullName: {type: String, required: true},
    questionIds: [String],
    startedAt: {type: Date, default: Date.now},
    submittedAt: Date,
    percent: Number,
    passed: Boolean,
  }),
);

const certificateSchema = new mongoose.Schema({
  code: {type: String, required: true, unique: true},
  userId: {type: String, required: true},
  fullName: {type: String, required: true},
  track: {type: String, required: true},
  percent: Number,
  skills: Object,
  issuedAt: {type: Date, default: Date.now},
});
certificateSchema.index({userId: 1, track: 1}, {unique: true}); // one certificate per track
const Certificate = mongoose.model('Certificate', certificateSchema);

const trackName = (slug) => TRACKS.find((t) => t.slug === slug)?.name ?? slug;
const publicCert = (c) => ({
  code: c.code,
  fullName: c.fullName,
  track: c.track,
  trackName: trackName(c.track),
  percent: c.percent,
  skills: c.skills,
  issuedAt: c.issuedAt,
});

const app = createApp('learning');

app.get('/tracks', (_req, res) => res.json({data: TRACKS}));

app.get(
  '/verify/:code',
  asyncHandler(async (req, res) => {
    const cert = await Certificate.findOne({code: req.params.code.toUpperCase()});
    if (!cert) throw new ApiError(404, 'NOT_FOUND', 'No certificate has this code');
    res.json({data: publicCert(cert)});
  }),
);

app.use(requireAuth);

app.get(
  '/me',
  asyncHandler(async (req, res) => {
    const [certificates, attempts] = await Promise.all([
      Certificate.find({userId: req.user.sub}).sort({issuedAt: -1}),
      Attempt.find({userId: req.user.sub}, {questionIds: 0}).sort({startedAt: -1}).limit(20),
    ]);
    res.json({data: {certificates: certificates.map(publicCert), attempts}});
  }),
);

app.post(
  '/exam/start',
  validate(
    z.object({
      track: z.enum(TRACKS.map((t) => t.slug)),
      fullName: z.string().trim().min(2, 'Enter the name for your certificate').max(80),
    }),
  ),
  asyncHandler(async (req, res) => {
    const {track, fullName} = req.body;
    const userId = req.user.sub;
    if (await Certificate.exists({userId, track}))
      throw new ApiError(409, 'ALREADY_CERTIFIED', 'You already passed this track');

    const last = await Attempt.findOne({userId, track}).sort({startedAt: -1});
    let attempt = last && !last.submittedAt && withinTime(last.startedAt) ? last : null;
    if (!attempt) {
      const retryAt = last?.startedAt && new Date(last.startedAt.getTime() + RETRY_HOURS * 3_600_000);
      if (last && retryAt > new Date()) {
        throw new ApiError(429, 'RETRY_LATER', `You can try again after ${retryAt.toLocaleString('en-IN')}`);
      }
      const ids = bankForSlug(track).map((q) => q.id);
      // Fisher–Yates with a crypto source: order is not guessable.
      for (let i = ids.length - 1; i > 0; i--) {
        const j = crypto.randomInt(i + 1);
        [ids[i], ids[j]] = [ids[j], ids[i]];
      }
      attempt = await Attempt.create({userId, track, fullName, questionIds: ids});
    }
    const bank = bankForSlug(track);
    const questions = attempt.questionIds.map((id) => bank.find((q) => q.id === id));
    res.json({
      data: {
        id: attempt._id,
        track,
        trackName: trackName(track),
        endsAt: new Date(attempt.startedAt.getTime() + EXAM_MINUTES * 60_000),
        questions: publicQuestions(questions),
      },
    });
  }),
);

app.post(
  '/exam/:id/submit',
  validate(z.object({answers: z.record(z.string(), z.number().int().min(0).max(9))})),
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(404, 'NOT_FOUND', 'Exam not found');
    const attempt = await Attempt.findOne({_id: req.params.id, userId: req.user.sub});
    if (!attempt) throw new ApiError(404, 'NOT_FOUND', 'Exam not found');
    const bank = bankForSlug(attempt.track);
    const questions = attempt.questionIds.map((id) => bank.find((q) => q.id === id));
    // Late answers count as none, so running out the clock never helps.
    const result = withinTime(attempt.startedAt) ? score(questions, req.body.answers) : score(questions, {});

    // Only the first submit counts.
    const done = await Attempt.findOneAndUpdate(
      {_id: attempt._id, submittedAt: null},
      {$set: {submittedAt: new Date(), percent: result.percent, passed: result.passed}},
      {new: true},
    );
    if (!done) throw new ApiError(409, 'ALREADY_SUBMITTED', 'This exam was already submitted');

    let certificate = null;
    if (result.passed) {
      const cert = await Certificate.create({
        code: `PC-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        userId: req.user.sub,
        fullName: attempt.fullName,
        track: attempt.track,
        percent: result.percent,
        skills: result.skills,
      });
      certificate = publicCert(cert);
    }
    res.json({data: {percent: result.percent, passed: result.passed, certificate}});
  }),
);

start(finish(app), {
  name: 'learning',
  port: Number(env('PORT', 4006)),
  mongoUri: env('MONGO_URI', 'mongodb://127.0.0.1:27017/pirento_learning'),
});
