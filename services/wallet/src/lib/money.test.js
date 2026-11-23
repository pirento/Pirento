// Tests for money.js.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {toPaise} from './money.js';

test('toPaise converts rupees to whole paise', () => {
  assert.equal(toPaise(499), 49900);
  assert.equal(toPaise(0.1 + 0.2), 30);
  assert.equal(toPaise(19.99), 1999);
});

test('toPaise rejects zero, negatives and sub-paise amounts', () => {
  for (const bad of [0, -5, 1.234, NaN, Infinity]) assert.throws(() => toPaise(bad), /Amount/);
});
