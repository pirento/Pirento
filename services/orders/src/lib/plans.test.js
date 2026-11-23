// Tests for plans.js.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {endOf, paidPlanOf} from './plans.js';

const now = new Date('2026-01-01T00:00:00Z');
const plan = {_id: 'p1', months: 12};

test('a paid plan counts only until it ends', () => {
  assert.equal(paidPlanOf({plan: {until: new Date('2026-06-01')}}, now)?.until.getFullYear(), 2026);
  assert.equal(paidPlanOf({plan: {until: new Date('2025-12-31')}}, now), null);
  assert.equal(paidPlanOf({}, now), null);
});

test('a renewal adds to the running plan; a new one starts today', () => {
  assert.equal(endOf({}, plan, now).toISOString(), '2026-12-27T00:00:00.000Z');
  const running = {plan: {id: 'p1', until: new Date('2026-03-01T00:00:00Z')}};
  assert.equal(endOf(running, plan, now).toISOString(), '2027-02-24T00:00:00.000Z');
});
