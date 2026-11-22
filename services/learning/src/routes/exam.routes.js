// Taking the exam. The answer key never leaves this service.
import {Router} from 'express';
import {z} from 'zod';
import {ApiError, conflict, isId, notFound, requireAuth, validate} from '@pirento/shared/server';
import {config} from '../config.js';
import {Attempt} from '../models/Attempt.js';
import {Certificate} from '../models/Certificate.js';
import {EXAM_MINUTES, PASS_PERCENT, publicQuestions, score, withinTime} from '../lib/exam.js';
import {bankOf, trackOf} from '../lib/bank.js';
import {newCertificateCode, publicCertificate, shuffled} from '../lib/certificate.js';

export const examRoutes = Router();
examRoutes.use(requireAuth);

/** The attempt's questions, in its order; switched-off questions still count, so a score never changes. */
const questionsOf = async (attempt) => {
  const bank = await bankOf(attempt.track, {withInactive: true});
  return attempt.questionIds.map((id) => bank.find((q) => q.id === id)).filter(Boolean);
};
const minutesOf = (attempt) => attempt.minutes ?? EXAM_MINUTES;
const inTime = (attempt) => withinTime(attempt.startedAt, Date.now(), minutesOf(attempt));

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
      track: z.string().trim().min(1).max(40),
      fullName: z.string().trim().min(2, 'Enter the name for your certificate').max(80),
    }),
  ),
  async (req, res) => {
    const {track, fullName} = req.body;
    const userId = req.user.sub;
    const rules = await trackOf(track);
    if (!rules?.active) throw notFound('This track is not taking exams');
    if (await Certificate.exists({userId, track})) throw conflict('ALREADY_CERTIFIED', 'You already passed this track');

    const last = await Attempt.findOne({userId, track}).sort({startedAt: -1});
    let attempt = last && !last.submittedAt && inTime(last) ? last : null;
    if (!attempt) {
      const retryAt = last && new Date(last.startedAt.getTime() + config.retryAfterHours * 3_600_000);
      if (retryAt > new Date()) {
        throw new ApiError(429, 'RETRY_LATER', `You can try again after ${retryAt.toLocaleString('en-IN')}`);
      }
      // An attempt left running past its time is closed as a fail, so it no longer holds the one open slot.
      if (last?.open && !last.submittedAt) {
        await Attempt.updateOne(
          {_id: last._id, open: true},
          {$set: {submittedAt: new Date(), percent: 0, passed: false}, $unset: {open: 1}},
        );
      }
      // A fresh random draw each time, so two attempts (or two people) rarely see the same set.
      const ids = shuffled((await bankOf(track)).map((q) => q.id)).slice(0, rules.questions);
      if (!ids.length) throw notFound('This track has no questions yet');
      try {
        attempt = await Attempt.create({
          userId,
          track,
          fullName,
          questionIds: ids,
          minutes: rules.minutes,
          passPercent: rules.passPercent,
        });
      } catch (err) {
        // Two "start"s at once: the database kept one attempt open, and both get that one.
        if (err.code !== 11000) throw err;
        attempt = await Attempt.findOne({userId, track, open: true});
      }
    }

    res.json({
      data: {
        id: attempt._id,
        track,
        trackName: rules.name,
        endsAt: new Date(attempt.startedAt.getTime() + minutesOf(attempt) * 60_000),
        questions: publicQuestions(await questionsOf(attempt)),
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
    const result = score(
      await questionsOf(attempt),
      inTime(attempt) ? req.body.answers : {},
      attempt.passPercent ?? PASS_PERCENT,
    );

    const done = await Attempt.findOneAndUpdate(
      {_id: attempt._id, submittedAt: null},
      {$set: {submittedAt: new Date(), percent: result.percent, passed: result.passed}, $unset: {open: 1}},
      {new: true},
    );
    if (!done) throw conflict('ALREADY_SUBMITTED', 'This exam was already submitted');

    let certificate = null;
    if (result.passed) {
      // One certificate per person and track (a unique index): a second pass returns the first certificate.
      const cert = await Certificate.create({
        code: newCertificateCode(),
        userId: req.user.sub,
        fullName: attempt.fullName,
        track: attempt.track,
        title: (await trackOf(attempt.track))?.name,
        percent: result.percent,
        skills: result.skills,
      }).catch(async (err) => {
        const first = err.code === 11000 && (await Certificate.findOne({userId: req.user.sub, track: attempt.track}));
        if (!first) throw err; // a clash on the random code, not a second pass
        return first;
      });
      certificate = publicCertificate(cert);
    }
    res.json({data: {percent: result.percent, passed: result.passed, certificate}});
  },
);
