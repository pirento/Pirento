import {test} from 'node:test';
import assert from 'node:assert/strict';
import {periodOf} from './program.js';

test('periods are in India time', () => {
  // 20:00 UTC on 22 Nov is 01:30 on 23 Nov in India.
  const late = new Date('2026-11-22T20:00:00Z');
  assert.equal(periodOf('daily', late).period, '2026-11-23');
  assert.equal(periodOf('monthly', late).period, '2026-11');
  assert.equal(periodOf('weekly', new Date('2026-01-01T06:00:00Z')).period, '2026-W01');
  assert.equal(periodOf('weekly', new Date('2026-11-23T06:00:00Z')).period, '2026-W48');
});

test('due is the end of the period in India time', () => {
  const d = periodOf('daily', new Date('2026-11-22T06:00:00Z')).due;
  assert.equal(d.toISOString(), '2026-11-22T18:29:59.000Z');
  assert.equal(periodOf('monthly', new Date('2026-11-22T06:00:00Z')).due.toISOString(), '2026-11-30T18:29:59.000Z');
  assert.equal(periodOf('weekly', new Date('2026-11-25T06:00:00Z')).due.toISOString(), '2026-11-29T18:29:59.000Z');
});
