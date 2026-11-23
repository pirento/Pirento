// Tests for businessAccount.js.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isUsername, passwordProblem} from '@pirento/shared';
import {firstPassword} from './businessAccount.js';

test('first passwords meet the password rules', () => {
  for (let i = 0; i < 50; i++) {
    const p = firstPassword();
    assert.equal(passwordProblem(p), '');
    assert.equal(p.length, 14);
  }
  assert.ok(isUsername('asha.rao'));
});
