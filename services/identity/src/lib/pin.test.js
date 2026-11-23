// Tests for pin.js.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {hashPin, samePin} from './pin.js';

test('a PIN hash is salted and checks back', async () => {
  const [a, b] = await Promise.all([hashPin('482916'), hashPin('482916')]);
  assert.match(a, /^scrypt:[0-9a-f]{32}:[0-9a-f]{64}$/);
  assert.notEqual(a, b);
  assert.equal(await samePin({pin: {hash: a}}, '482916'), true);
  assert.equal(await samePin({pin: {hash: a}}, '482917'), false);
});
