// Tests for coupons.js.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {discountFor} from './coupons.js';

const base = {active: true, kind: 'percent', value: 10, uses: 0, maxUses: 0, minAmount: 0};

test('percent and flat discounts, in paise', () => {
  assert.equal(discountFor(base, 'legal', 199900), 19990);
  assert.equal(discountFor({...base, kind: 'flat', value: 200}, 'legal', 199900), 20000);
});

test('never takes the total below ₹1', () => {
  assert.equal(discountFor({...base, kind: 'flat', value: 5000}, 'legal', 49900), 49800);
  assert.equal(discountFor({...base, value: 100}, 'legal', 49900), 49800);
});

test('refuses expired, used up, wrong product, too small', () => {
  assert.throws(() => discountFor({...base, active: false}, 'legal', 1000), /not valid/);
  assert.throws(() => discountFor({...base, expiresAt: new Date(0)}, 'legal', 1000), /expired/);
  assert.throws(() => discountFor({...base, maxUses: 2, uses: 2}, 'legal', 1000), /used up/);
  assert.throws(() => discountFor({...base, product: 'black'}, 'legal', 1000), /this product/);
  assert.throws(() => discountFor({...base, minAmount: 500}, 'legal', 1000), /at least ₹500/);
  assert.throws(() => discountFor(null, 'legal', 1000), /not valid/);
});
