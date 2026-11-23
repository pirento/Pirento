// Tests for rules.js.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isUsername, maskPhone, passwordProblem, toPhone} from './rules.js';

test('Indian mobiles in any common form', () => {
  assert.equal(toPhone('98765 43210'), '+919876543210');
  assert.equal(toPhone('+91 98765-43210'), '+919876543210');
  assert.equal(toPhone('919876543210'), '+919876543210');
  assert.equal(toPhone('12345 67890'), null); // must start 6-9
  assert.equal(toPhone('98765'), null);
  assert.equal(maskPhone('+919876543210'), '+91 ••••• •3210');
});

test('user IDs', () => {
  assert.equal(isUsername('asha.verma'), true);
  assert.equal(isUsername('a1'), false);
  assert.equal(isUsername('1asha'), false);
  assert.equal(isUsername('asha@x.com'), false);
  assert.equal(isUsername('Asha'), false); // the server lowercases first
});

test('passwords need length, a letter and a number', () => {
  assert.match(passwordProblem('short1'), /at least 8/);
  assert.match(passwordProblem('longenough'), /letter and one number/);
  assert.equal(passwordProblem('longenough1'), '');
});
