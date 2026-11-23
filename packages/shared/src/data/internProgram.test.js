// Tests for internProgram.js.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PROGRAM_SCORE, finalMark, gradeFor} from './internProgram.js';

test('weights add up to 100 and the mark follows them', () => {
  assert.equal(
    Object.values(PROGRAM_SCORE).reduce((a, b) => a + b, 0),
    100,
  );
  assert.equal(finalMark({tasks: 100, work: 100, attendance: 100, lessons: 100}), 100);
  assert.equal(finalMark({tasks: 50, work: 100}), 60);
  assert.equal(finalMark({}), 0);
});

test('grades', () => {
  assert.equal(gradeFor(95), 'A+');
  assert.equal(gradeFor(50), 'D');
  assert.equal(gradeFor(49), 'F');
});
