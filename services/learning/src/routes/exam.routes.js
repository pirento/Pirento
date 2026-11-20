import {Router} from 'express';
import {z} from 'zod';
import {TRACKS, bankForSlug} from '@pirento/shared/exam';
import {ApiError, conflict, isId, notFound, requireAuth, validate} from '@pirento/shared/server';
import {config} from '../config.js';
import {Attempt} from '../models/Attempt.js';
import {Certificate} from '../models/Certificate.js';
import {EXAM_MINUTES, publicQuestions, score, withinTime} from '../lib/exam.js';
import {newCertificateCode, publicCertificate, shuffled, trackName} from '../lib/certificate.js';

// Taking the exam. The answer key never leaves this service.
export const examRoutes = Router();
examRoutes.use(requireAuth);

const questionsOf = (attempt) => {
  const bank = bankForSlug(attempt.track);
  return attempt.questionIds.map((id) => bank.find((q) => q.id === id));
};

examRoutes.get('/me', async (req, res) => {
  const [certificates, attempts] = await Promise.all([
    Certificate.find({userId: req.user.sub}).sort({issuedAt: -1}),
    Attempt.find({userId: req.user.sub}, {questionIds: 0}).sort({startedAt: -1}).limit(20),
  ]);
  res.json({data: {certificates: certificates.map(publicCertificate), attempts}});
});

/**
 * Starts an exam, or resumes the one still running for this track, so a page
 * reload never hands out a fresh set of questions.
 */
examRoutes.post(
  '/exam/start',
  validate(
    z.object({
      track: z.enum(TRACKS.map((t) => t.slug)),
      fullName: z.string().trim().min(2, 'Enter the name for your certificate').max(80),
    }),
  ),
  async (req, res) => {
    const {track, fullName} = req.body;
    const userId = req.user.sub;
    if (await Certificate.exists({userId, track})) throw conflict('ALREADY_CERTIFIED', 'You already passed this track');

    const last = await Attempt.findOne({userId, track}).sort({startedAt: -1});
    let attempt = last && !last.submittedAt && withinTime(last.startedAt) ? last : null;
    if (!attempt) {
      const retryAt = last && new Date(last.startedAt.getTime() + config.retryAfterHours * 3_600_000);
      if (retryAt > new Date()) {
        throw new ApiError(429, 'RETRY_LATER', `You can try again after ${retryAt.toLocaleString('en-IN')}`);
      }
      const ids = shuffled(bankForSlug(track).map((q) => q.id));
      attempt = await Attempt.create({userId, track, fullName, questionIds: ids});
    }

    res.json({
      data: {
        id: attempt._id,
        track,
        trackName: trackName(track),
        endsAt: new Date(attempt.startedAt.getTime() + EXAM_MINUTES * 60_000),
        questions: publicQuestions(questionsOf(attempt)),
      },
    });
  },
);

examRoutes.post(
  '/exam/:id/submit',
  validate(z.object({answers: z.record(z.string(), z.number().int().min(0).max(9))})),
  async (req, res) => {
    const attempt = isId(req.params.id) && (await Attempt.findOne({_id: req.params.id, userId: req.user.sub}));
    if (!attempt) throw notFound('Exam not found');

    // Answers sent after the clock ran out count as none: running it out never helps.
    const result = score(questionsOf(attempt), withinTime(attempt.startedAt) ? req.body.answers : {});

    const done = await Attempt.findOneAndUpdate(
      {_id: attempt._id, submittedAt: null},
      {$set: {submittedAt: new Date(), percent: result.percent, passed: result.passed}},
      {new: true},
    );
    if (!done) throw conflict('ALREADY_SUBMITTED', 'This exam was already submitted');

    let certificate = null;
    if (result.passed) {
      const cert = await Certificate.create({
        code: newCertificateCode(),
        userId: req.user.sub,
        fullName: attempt.fullName,
        track: attempt.track,
        percent: result.percent,
        skills: result.skills,
      });
      certificate = publicCertificate(cert);
    }
    res.json({data: {percent: result.percent, passed: result.passed, certificate}});
  },
);
