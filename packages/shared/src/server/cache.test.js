// Tests for cache.js.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cached, forget} from './cache.js';

test('loads once per key until forgotten', async () => {
  let loads = 0;
  const load = async () => ({n: ++loads});
  assert.deepEqual(await cached('t:a', 60, load), {n: 1});
  assert.deepEqual(await cached('t:a', 60, load), {n: 1});
  await forget('t:a');
  assert.deepEqual(await cached('t:a', 60, load), {n: 2});
});
