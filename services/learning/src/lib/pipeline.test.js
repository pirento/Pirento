import {test} from 'node:test';
import assert from 'node:assert/strict';
import {APPLICANT_MOVES, TEAM_MOVES, canMove, tasksDone} from './pipeline.js';

test('the team moves forward, never into an applicant answer', () => {
  assert.ok(canMove(TEAM_MOVES, 'new', 'shortlisted'));
  assert.ok(canMove(TEAM_MOVES, 'interview', 'interview'));
  assert.ok(!canMove(TEAM_MOVES, 'offered', 'accepted'));
  assert.ok(!canMove(TEAM_MOVES, 'completed', 'declined'));
  assert.ok(!canMove(TEAM_MOVES, 'new', 'completed'));
});

test('only an offer can be answered', () => {
  assert.ok(canMove(APPLICANT_MOVES, 'offered', 'accepted'));
  assert.ok(!canMove(APPLICANT_MOVES, 'interview', 'accepted'));
});

test('an internship completes only with every task approved', () => {
  assert.ok(!tasksDone([]));
  assert.ok(!tasksDone([{status: 'approved'}, {status: 'submitted'}]));
  assert.ok(tasksDone([{status: 'approved'}]));
});
