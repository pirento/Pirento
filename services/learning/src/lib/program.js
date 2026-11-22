// The programme's rules in code: periods for daily/weekly/monthly tasks, who may get paid work, writing a task,
// buying a place and working out the final mark.
import {ApiError, callService, conflict, env, notFound} from '@pirento/shared/server';
import {PROGRAM_PASS, finalMark, gradeFor} from '@pirento/shared';
import {Assignment} from '../models/Assignment.js';
import {Attendance} from '../models/Attendance.js';
import {Certificate} from '../models/Certificate.js';
import {Enrolment} from '../models/Enrolment.js';
import {Lesson} from '../models/Lesson.js';
import {LiveClass} from '../models/LiveClass.js';
import {Program} from '../models/Program.js';
import {Progress} from '../models/Progress.js';
import {Work} from '../models/Work.js';
import {ask} from './ai.js';
import {newCertificateCode} from './certificate.js';

const DAY = 86_400_000;
const END = 5.5 * 3_600_000 + 1000; // from UTC midnight back to 23:59:59 India time
const WALLET_URL = env('WALLET_URL', 'http://127.0.0.1:4002');
const IDENTITY_URL = env('IDENTITY_URL', 'http://127.0.0.1:4005');

/** The period a task belongs to and when it is due (one second before the period ends), in India time. */
export function periodOf(cadence, now = new Date()) {
  const ist = new Date(now.getTime() + 5.5 * 3_600_000); // IST has no daylight saving
  const day = ist.toISOString().slice(0, 10);
  if (cadence === 'daily') return {period: day, due: new Date(Date.parse(day) + DAY - END)};
  if (cadence === 'monthly') {
    const y = ist.getUTCFullYear();
    const m = ist.getUTCMonth();
    return {period: day.slice(0, 7), due: new Date(Date.UTC(y, m + 1, 1) - END)};
  }
  // ISO week: the Thursday of this week decides the year.
  const d = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()));
  const dow = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dow);
  const week = Math.ceil(((d - Date.UTC(d.getUTCFullYear(), 0, 1)) / DAY + 1) / 7);
  const monday = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) - (dow - 1) * DAY;
  return {
    period: `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`,
    due: new Date(monday + 7 * DAY - END),
  };
}

export const running = (userId) => Enrolment.findOne({userId, status: 'active'});

/** Whether the person holds an issued Bharat ID (asked of the identity service). */
const hasBharatId = async (userId) => (await callService(IDENTITY_URL, '/internal/issued', {userId})).issued;

/**
 * What stands between a person and paid work: a running place, an issued Bharat ID, a passed track exam
 * (their proof they can do the work) and a filled profile.
 */
export async function eligibility(userId, enrolment) {
  const [bharatId, certified] = await Promise.all([
    hasBharatId(userId).catch(() => false),
    Certificate.exists({userId, kind: {$ne: 'internship'}}).then(Boolean),
  ]);
  const checks = {
    enrolled: Boolean(enrolment && enrolment.status === 'active'),
    bharatId,
    certified,
    profile: Boolean(enrolment?.profile?.track && enrolment.profile.skills?.length),
  };
  return {checks, eligible: Object.values(checks).every(Boolean)};
}

/** Buys a place from the wallet. The ref is per person, length and day: a double click pays and enrols once. */
export async function buyPlace(user, months, now = new Date()) {
  const program = await Program.findOne({months, active: true}).lean();
  if (!program) throw notFound('This programme is not on sale yet');
  if (await running(user.sub)) throw conflict('ENROLLED', 'You are already on a programme');
  const ref = `intern-program-${user.sub}-${months}-${now.toISOString().slice(0, 10)}`;
  const done = await Enrolment.findOne({ref});
  if (done) return done;
  if (program.price) {
    await callService(WALLET_URL, '/internal/debit', {
      userId: user.sub,
      amount: program.price,
      ref,
      note: `Pirento Intern · ${months}-month programme`,
    });
  }
  try {
    return await Enrolment.create({
      userId: user.sub,
      email: user.email,
      months,
      paid: program.price,
      ref,
      endsAt: new Date(now.getTime() + months * 30 * DAY),
    });
  } catch (err) {
    // Same ref (a retry) or a place opened meanwhile: the money moved once, so return what is there.
    if (err.code !== 11000) throw err;
    const existing = (await Enrolment.findOne({ref})) ?? (await running(user.sub));
    if (!existing) throw new ApiError(409, 'ENROLLED', 'You are already on a programme');
    return existing;
  }
}

const lessonList = async (track) =>
  (await Lesson.find({track, published: true}, {title: 1, order: 1}).sort({order: 1}).lean()).map((l) => ({
    id: String(l._id),
    title: l.title,
  }));

/** Writes a claimed task: the AI if it can, else "finish your next lesson". */
async function writeTask(a, enrolment) {
  const lessons = await lessonList(enrolment.profile?.track ?? '');
  const recent = await Assignment.find({userId: a.userId, status: 'graded'}, {title: 1, grade: 1})
    .sort({updatedAt: -1})
    .limit(8)
    .lean();
  const ai = await ask('task', {
    cadence: a.cadence,
    profile: enrolment.profile ?? {},
    recentGrades: recent.map((r) => ({title: r.title, grade: r.grade})),
    lessons,
  });
  const known = new Set(lessons.map((l) => l.id));
  let set;
  if (ai) {
    set = {
      title: ai.title.slice(0, 200),
      detail: ai.detail.slice(0, 4000),
      lessonIds: ai.lessonIds.filter((id) => known.has(id)),
      by: 'ai',
    };
  } else {
    const done = new Set((await Progress.find({userId: a.userId}, {lessonId: 1}).lean()).map((p) => p.lessonId));
    const next = lessons.find((l) => !done.has(l.id));
    set = next
      ? {
          title: `Finish “${next.title}”`,
          detail:
            'Read the lesson, get its practice right, then write in your own words what you learnt and one way you would use it.',
          lessonIds: [next.id],
          by: 'lesson',
        }
      : {
          title: `Your ${a.cadence} write-up`,
          detail:
            'Write what you worked on, what you learnt and what you will do next. Add a link to anything you made.',
          lessonIds: [],
          by: 'lesson',
        };
  }
  return Assignment.findOneAndUpdate({_id: a._id, by: 'pending'}, {$set: set}, {new: true});
}

/** Today's, this week's and this month's tasks, writing any that do not exist yet (each claimed once). */
export async function currentTasks(enrolment, now = new Date()) {
  return Promise.all(
    ['daily', 'weekly', 'monthly'].map(async (cadence) => {
      const {period, due} = periodOf(cadence, now);
      const key = {userId: enrolment.userId, cadence, period};
      let a = await Assignment.findOne(key);
      let created = false;
      if (!a) {
        try {
          a = await Assignment.create({...key, enrolmentId: String(enrolment._id), due});
          created = true;
        } catch (err) {
          if (err.code !== 11000) throw err;
          return Assignment.findOne(key); // another request claimed it and is writing it
        }
      }
      // A claim older than two minutes whose writer died is written again.
      if (a.by === 'pending' && (created || now - a.createdAt > 120_000)) {
        return (await writeTask(a, enrolment)) ?? Assignment.findById(a._id);
      }
      return a;
    }),
  );
}

/** Reviews an answer with the AI; returns the fields to set, or null to leave it for staff. */
export async function aiReview(task, answer, link, track) {
  const lessons = await lessonList(track ?? '');
  const r = await ask('review', {task, answer, link, lessons});
  if (!r) return null;
  const known = new Set(lessons.map((l) => l.id));
  return {
    grade: Math.max(0, Math.min(100, r.grade)),
    feedback: r.feedback.slice(0, 2000),
    problems: r.problems.slice(0, 10).map((p) => p.slice(0, 300)),
    lessonIds: r.lessonIds.filter((id) => known.has(id)).slice(0, 3),
  };
}

const avg = (xs) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);

/**
 * The four parts of the final mark, each 0–100: practice tasks (a task past its due date and never sent counts
 * 0), approved paid work, live classes attended out of those held for them, and lessons finished in their track.
 */
export async function scoreOf(enrolment, now = new Date()) {
  const {userId, startsAt} = enrolment;
  const until = enrolment.finishedAt ?? now;
  const track = enrolment.profile?.track ?? '';
  const [tasks, work, classes, attended, lessons, done] = await Promise.all([
    Assignment.find({enrolmentId: String(enrolment._id)}, {status: 1, grade: 1, due: 1}).lean(),
    Work.find({'assignee.userId': userId, status: 'approved'}, {grade: 1}).lean(),
    LiveClass.find({startsAt: {$gte: startsAt, $lte: until}, track: {$in: ['', track]}}, {_id: 1}).lean(),
    Attendance.find({userId}, {classId: 1}).lean(),
    Lesson.countDocuments({track, published: true}),
    Progress.countDocuments({userId, track}),
  ]);
  const counted = tasks.filter((t) => t.status === 'graded' || t.due < now);
  const held = new Set(classes.map((c) => String(c._id)));
  const parts = {
    tasks: avg(counted.map((t) => t.grade ?? 0)),
    work: avg(work.map((w) => w.grade ?? 0)),
    attendance: held.size ? Math.round((attended.filter((a) => held.has(a.classId)).length / held.size) * 100) : 100,
    lessons: lessons ? Math.round((Math.min(done, lessons) / lessons) * 100) : 100,
  };
  const total = finalMark(parts);
  return {...parts, total, grade: gradeFor(total), passed: total >= PROGRAM_PASS};
}

/** Ends a place: fixes the mark and, when it passes, issues the programme certificate (once). */
export async function finish(enrolment, now = new Date()) {
  const score = await scoreOf(enrolment, now);
  let certificateCode;
  if (score.passed) {
    const track = `program-${enrolment._id}`;
    const cert =
      (await Certificate.findOne({userId: enrolment.userId, track})) ??
      (await Certificate.create({
        code: newCertificateCode(),
        kind: 'program',
        userId: enrolment.userId,
        fullName: enrolment.profile?.fullName || enrolment.email,
        track,
        title: `${enrolment.months}-month internship programme · grade ${score.grade}`,
        company: 'Pirento',
        weeks: Math.round((enrolment.months * 30) / 7),
        percent: score.total,
        skills: {tasks: score.tasks, work: score.work, attendance: score.attendance, lessons: score.lessons},
      }));
    certificateCode = cert.code;
  }
  const {passed, ...kept} = score;
  return Enrolment.findOneAndUpdate(
    {_id: enrolment._id, status: 'active'},
    {$set: {status: 'finished', finishedAt: now, score: kept, certificateCode}},
    {new: true},
  );
}
