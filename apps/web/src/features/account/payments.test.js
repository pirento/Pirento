// Run with: node --test apps/web/src/features/account/payments.test.js
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {paymentHistory, spentThisMonth} from './payments.js';

const tx = [
  {_id: 1, type: 'credit', amount: 50000, note: 'Test top-up', createdAt: '2026-11-01T10:00:00Z'},
  {_id: 2, type: 'debit', amount: 99900, note: 'Order #1 · GST', createdAt: '2026-11-03T10:00:00Z'},
];
const orders = [
  {_id: 'a', orderNo: 1, serviceName: 'GST', product: 'legal', amount: 99900, payment: {method: 'wallet'}},
  {
    _id: 'b',
    orderNo: 2,
    serviceName: 'ITR',
    product: 'black',
    amount: 79900,
    payment: {method: 'razorpay'},
    timeline: [{status: 'paid', at: '2026-11-05T10:00:00Z'}],
  },
  {_id: 'c', orderNo: 3, serviceName: 'Kit', product: 'giftox', amount: 1000, status: 'pending_payment'},
];

test('wallet moves plus card payments, newest first, wallet order payments not counted twice', () => {
  const h = paymentHistory(tx, orders);
  assert.deepEqual(
    h.map((p) => p.key),
    ['o-b', 'w-2', 'w-1'],
  );
  assert.equal(h[0].method, 'Card / UPI');
  assert.equal(h[0].product, 'black');
});

test('spent this month counts money out only', () => {
  assert.equal(spentThisMonth(paymentHistory(tx, orders), new Date('2026-11-20')), 99900 + 79900);
  assert.equal(spentThisMonth(paymentHistory(tx, orders), new Date('2026-12-20')), 0);
});
