// Tests for triage.js.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {higher} from './triage.js';

test('the AI can raise a priority, never lower it', () => {
  assert.equal(higher('medium', 'high'), 'high');
  assert.equal(higher('high', 'low'), 'high');
  assert.equal(higher('low', 'medium'), 'medium');
});
