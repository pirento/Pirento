import {EXAM_RULES} from '@pirento/shared';

export const EXAM_MINUTES = EXAM_RULES.minutes;
export const PASS_PERCENT = EXAM_RULES.passPercent;
const GRACE_MS = 2 * 60_000; // network slack on submit

/** Questions as the browser sees them: no answers. */
export const publicQuestions = (questions) => questions.map(({id, question, options}) => ({id, question, options}));

/**
 * Scores answers ({questionId: optionIndex}) against the bank.
 * Returns the overall percent and a per-skill percent for the certificate.
 */
export function score(questions, answers) {
  const skills = {};
  let correct = 0;
  for (const q of questions) {
    const ok = answers?.[q.id] === q.answer;
    correct += ok ? 1 : 0;
    skills[q.skill] ??= {correct: 0, total: 0};
    skills[q.skill].correct += ok ? 1 : 0;
    skills[q.skill].total += 1;
  }
  const percent = Math.round((correct / questions.length) * 100);
  return {
    percent,
    passed: percent >= PASS_PERCENT,
    skills: Object.fromEntries(Object.entries(skills).map(([k, v]) => [k, Math.round((v.correct / v.total) * 100)])),
  };
}

export const withinTime = (startedAt, now = Date.now()) =>
  now - startedAt.getTime() <= EXAM_MINUTES * 60_000 + GRACE_MS;
