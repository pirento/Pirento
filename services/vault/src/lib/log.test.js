// Tests for the log's hash chain.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {checkChain} from './log.js';

const make = (n) => {
  const out = [];
  let prev;
  for (let i = 0; i < n; i++) {
    const e = {
      userId: 'u',
      at: new Date(Date.UTC(2026, 0, i + 1)),
      by: 'owner',
      action: 'record.add',
      target: `r${i}`,
      pin: true,
      prev,
    };
    e.hash = crypto
      .createHash('sha256')
      .update([e.prev ?? '', e.userId, e.at.toISOString(), e.by, e.action, e.target, 1].join('|'))
      .digest('hex');
    prev = e.hash;
    out.push(e);
  }
  return out;
};

test('an untouched log holds', () => {
  assert.equal(checkChain(make(4)), -1);
});

test('a changed or removed entry breaks the chain where it happened', () => {
  const changed = make(4);
  changed[2].action = 'record.delete';
  assert.equal(checkChain(changed), 2);
  const cut = make(4);
  cut.splice(1, 1);
  assert.equal(checkChain(cut), 1);
});
