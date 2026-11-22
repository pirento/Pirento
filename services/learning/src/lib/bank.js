// Tracks and their question banks: the built-in ones (@pirento/shared/exam) merged with what admin added.
import {EXAM_RULES} from '@pirento/shared';
import {cached} from '@pirento/shared/server';
import {TRACKS, bankForSlug} from '@pirento/shared/exam';
import {Question} from '../models/Question.js';
import {Track} from '../models/Track.js';

const builtIn = (t) => ({
  slug: t.slug,
  name: t.name,
  minutes: EXAM_RULES.minutes,
  passPercent: EXAM_RULES.passPercent,
  questions: EXAM_RULES.questions,
  active: true,
  builtIn: true,
});

/** Built-in tracks with admin's settings on top, then the tracks admin made. */
export function mergeTracks(rows) {
  const bySlug = Object.fromEntries(rows.map((r) => [r.slug, r]));
  const settings = (r) => ({
    name: r.name,
    minutes: r.minutes,
    passPercent: r.passPercent,
    questions: r.questions,
    active: r.active,
  });
  const merged = TRACKS.map((t) => ({...builtIn(t), ...(bySlug[t.slug] ? settings(bySlug[t.slug]) : {})}));
  for (const r of rows) {
    if (!TRACKS.some((t) => t.slug === r.slug)) merged.push({slug: r.slug, ...settings(r), builtIn: false});
  }
  return merged;
}

// Read on every exam start and track list, so cached; saving a track forgets it.
export const allTracks = () => cached('learning:tracks', 300, async () => mergeTracks(await Track.find().lean()));

export async function trackOf(slug) {
  return (await allTracks()).find((t) => t.slug === slug) ?? null;
}

const asQuestion = (q) => ({
  id: String(q._id),
  skill: q.skill,
  question: q.question,
  options: q.options,
  answer: q.answer,
});

/** The track's bank: built-in questions plus admin's. `withInactive` keeps switched-off ones, to mark old attempts. */
export async function bankOf(slug, {withInactive = false} = {}) {
  const extra = await Question.find({track: slug, ...(withInactive ? {} : {active: true})}).lean();
  return [...(bankForSlug(slug) ?? []), ...extra.map(asQuestion)];
}
