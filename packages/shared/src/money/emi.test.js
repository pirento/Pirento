import {test} from 'node:test';
import assert from 'node:assert/strict';
import {emi} from './emi.js';

test('EMI matches the standard formula and edge cases', () => {
  assert.equal(Math.round(emi(500000, 12, 36)), 16607); // ₹5 lakh, 12%, 3 years
  assert.equal(emi(120000, 0, 12), 10000); // zero interest
  assert.equal(emi(0, 12, 12), 0);
  assert.equal(emi(1000, 12, 0), 0);
});
