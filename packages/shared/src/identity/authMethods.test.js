// Tests for authMethods.js.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AUTH_METHODS, pinProblem} from './authMethods.js';

test('PIN rules', () => {
  assert.equal(pinProblem('482916'), '');
  assert.notEqual(pinProblem('12345'), '');
  assert.notEqual(pinProblem('111111'), '');
  assert.notEqual(pinProblem('123456'), '');
  assert.notEqual(pinProblem('654321'), '');
  assert.notEqual(pinProblem('12a456'), '');
});

test('every method has a level and a label', () => {
  for (const m of AUTH_METHODS) assert.ok(m.id && m.label && m.level >= 1);
});
