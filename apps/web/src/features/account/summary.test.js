// Run with: node --test apps/web/src/features/account/summary.test.js
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {greeting, summaryLine} from './summary.js';

test('nothing to do', () => assert.equal(summaryLine({orders: [], tickets: []}), 'Nothing needs you right now.'));
test('joins parts in plain English', () => {
  const orders = [{status: 'pending_payment'}, {status: 'paid'}, {status: 'in_progress'}];
  const tickets = [{status: 'answered'}];
  assert.equal(
    summaryLine({orders, tickets}),
    'You have 1 order waiting for payment, 2 orders with our team and 1 support reply to read.',
  );
});
test('greets by the hour', () =>
  assert.deepEqual([5, 13, 20].map(greeting), ['Good morning', 'Good afternoon', 'Good evening']));
