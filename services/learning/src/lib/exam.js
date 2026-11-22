// The final exam: picking questions, hiding answers from the browser, and marking.
import {EXAM_RULES} from '@pirento/shared';

export const EXAM_MINUTES = EXAM_RULES.minutes;
export const PASS_PERCENT = EXAM_RULES.passPercent;
const GRACE_MS = 2 * 60_000; // network slack on submit

/** Questions as the browser sees them: no answers. */
export const publicQuestions = (questions) => questions.map(({id, question, options}) => ({id, question, options}));

/**
 * Scores answers ({questionId: optionIndex}) against the questions drawn.
 * Returns the overall percent and a per-skill percent for the certificate.
 */
export function score(questions, answers, passPercent = PASS_PERCENT) {
  const skills = {};
  let correct = 0;
  for (const q of questions) {
    const ok = answers?.[q.id] === q.answer;
    correct += ok ? 1 : 0;
    skills[q.skill] ??= {correct: 0, total: 0};
    skills[q.skill].correct += ok ? 1 : 0;
    skills[q.skill].total += 1;
  }
  const percent = questions.length ? Math.round((correct / questions.length) * 100) : 0;
  return {
    percent,
    passed: percent >= passPercent,
    skills: Object.fromEntries(Object.entries(skills).map(([k, v]) => [k, Math.round((v.correct / v.total) * 100)])),
  };
}

/** `minutes` is the attempt's own limit, fixed when it started; older attempts use the default. */
export const withinTime = (startedAt, now = Date.now(), minutes = EXAM_MINUTES) =>
  now - startedAt.getTime() <= minutes * 60_000 + GRACE_MS;
