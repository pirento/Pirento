import {test} from 'node:test';
import assert from 'node:assert/strict';
import {challengeValid, newChallenge} from './challenge.js';

test('challenge codes are four digits', () => {
  for (let i = 0; i < 200; i++) assert.match(newChallenge(), /^\d{4}$/);
});

test('a challenge expires after 15 minutes', () => {
  const at = new Date(0);
  assert.ok(challengeValid({challenge: '1234', challengeAt: at}, 14 * 60_000));
  assert.ok(!challengeValid({challenge: '1234', challengeAt: at}, 16 * 60_000));
  assert.ok(!challengeValid({}, 0));
});
