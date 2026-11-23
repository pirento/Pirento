// Tests for password.js.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {hashPassword, verifyPassword} from './password.js';

test('a hash verifies its own password only', async () => {
  const stored = await hashPassword('correct horse battery');
  assert.match(stored, /^scrypt\$/);
  assert.equal(await verifyPassword('correct horse battery', stored), true);
  assert.equal(await verifyPassword('wrong horse battery', stored), false);
});

test('two hashes of one password differ (fresh salt)', async () => {
  assert.notEqual(await hashPassword('same password'), await hashPassword('same password'));
});

test('junk stored values never verify', async () => {
  assert.equal(await verifyPassword('x', undefined), false);
  assert.equal(await verifyPassword('x', 'plain-text'), false);
});
