// The daily allowance resets at midnight in India, not UTC.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {today} from './usage.js';

test('the day is India time', () => {
  assert.equal(today(new Date('2026-11-20T18:29:00Z')), '2026-11-20'); // 23:59 IST
  assert.equal(today(new Date('2026-11-20T18:31:00Z')), '2026-11-21'); // 00:01 IST
});
