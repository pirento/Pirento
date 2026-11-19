import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bankForSlug} from '@pirento/shared/exam';
import {publicQuestions, score, withinTime} from './exam.js';

const bank = bankForSlug('web-development');

test('public questions never carry the answer', () => {
  assert.ok(publicQuestions(bank).every((q) => !('answer' in q) && !('skill' in q)));
});

test('scores, pass mark and skill split', () => {
  const all = Object.fromEntries(bank.map((q) => [q.id, q.answer]));
  assert.deepEqual(score(bank, all).percent, 100);
  const six = Object.fromEntries(bank.slice(0, 6).map((q) => [q.id, q.answer]));
  assert.equal(score(bank, six).passed, true);
  const five = Object.fromEntries(bank.slice(0, 5).map((q) => [q.id, q.answer]));
  assert.equal(score(bank, five).passed, false);
  assert.equal(score(bank, {}).percent, 0);
  assert.deepEqual(Object.keys(score(bank, all).skills).sort(), ['practical', 'theoretical']);
});

test('time limit', () => {
  const start = new Date(0);
  assert.ok(withinTime(start, 31 * 60_000));
  assert.ok(!withinTime(start, 33 * 60_000));
});
