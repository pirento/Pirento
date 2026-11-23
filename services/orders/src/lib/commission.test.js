// Tests for commission.js.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {commissionOf} from './commission.js';

test('commission is a share of the order in paise, rounded down', () => {
  assert.equal(commissionOf(399800, 10), 39980);
  assert.equal(commissionOf(999, 5), 49);
  assert.equal(commissionOf(399800, 0), 0);
  assert.equal(commissionOf(100000, 2.5), 2500);
});
