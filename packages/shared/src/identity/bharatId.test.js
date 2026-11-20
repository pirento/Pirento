import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bharatIdFromSeq, isBharatId} from './bharatId.js';

test('IDs are 10 digits, valid, unique and not sequential', () => {
  const ids = Array.from({length: 20000}, (_, i) => bharatIdFromSeq(i));
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) assert.ok(isBharatId(id), id);
  assert.ok(Math.abs(Number(ids[1]) - Number(ids[2])) > 1000);
});

test('one wrong or swapped digit is rejected', () => {
  const id = bharatIdFromSeq(42);
  const wrong = id.slice(0, 3) + ((Number(id[3]) + 1) % 10) + id.slice(4);
  const swapped = id[1] !== id[2] ? id[0] + id[2] + id[1] + id.slice(3) : null;
  assert.ok(!isBharatId(wrong));
  if (swapped) assert.ok(!isBharatId(swapped));
  assert.ok(!isBharatId('0123456789'));
  assert.ok(!isBharatId(undefined));
});
