// Password health: weak and reused, without ever returning a password.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {healthOf, isWeak} from './health.js';

test('weak passwords', () => {
  assert.ok(isWeak('short1A!'));
  assert.ok(isWeak('alllowercaseletters'));
  assert.ok(isWeak('Password123'.toLowerCase()));
  assert.ok(isWeak('password123'));
  assert.ok(!isWeak('Monsoon-Train-42'));
});

test('reused across entries, and no password in the result', () => {
  const h = healthOf([
    {_id: 'a', password: 'Same-Pass-2026'},
    {_id: 'b', password: 'Same-Pass-2026'},
    {_id: 'c', password: 'Other-Pass-2026'},
  ]);
  assert.deepEqual(
    h.map((x) => x.reused),
    [true, true, false],
  );
  assert.ok(h.every((x) => !('password' in x)));
});
