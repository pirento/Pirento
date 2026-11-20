import {test} from 'node:test';
import assert from 'node:assert/strict';
import {clearFailures, recordFailure, waitFor} from './backoff.js';

test('each failure doubles the wait, capped at a minute', () => {
  const t = 1_000_000;
  recordFailure('a', t);
  assert.equal(waitFor('a', t), 1000);
  recordFailure('a', t);
  assert.equal(waitFor('a', t), 2000);
  for (let i = 0; i < 10; i++) recordFailure('a', t);
  assert.equal(waitFor('a', t), 60_000);
  assert.equal(waitFor('a', t + 60_000), 0);
  clearFailures('a');
  assert.equal(waitFor('a', t), 0);
});
