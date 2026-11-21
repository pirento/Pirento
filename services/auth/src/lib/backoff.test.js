import {test} from 'node:test';
import assert from 'node:assert/strict';
import {delayAfter} from './backoff.js';

test('each failure doubles the wait, capped at a minute', () => {
  assert.equal(delayAfter(1), 1000);
  assert.equal(delayAfter(2), 2000);
  assert.equal(delayAfter(12), 60_000);
});
