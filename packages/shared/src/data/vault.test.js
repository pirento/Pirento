// Tests for vault.js: record checks and the check-in stages.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {VAULT_KINDS, quietStage, validateRecord} from './vault.js';

test('a record keeps only its own fields, trimmed, and drops empty ones', () => {
  const r = validateRecord('bank', '  SBI savings ', {bank: ' SBI ', accountNo: '1234', ifsc: '', balance: '2500.50'});
  assert.deepEqual(r.data, {
    kind: 'bank',
    title: 'SBI savings',
    fields: {bank: 'SBI', accountNo: '1234', balance: '2500.50'},
  });
});

test('a record is refused without a title, with a stranger field, or with a bad number or date', () => {
  assert.ok(validateRecord('bank', '', {}).error);
  assert.ok(validateRecord('nope', 'x', {}).error);
  assert.ok(validateRecord('bank', 'x', {pin: '1'}).error);
  assert.ok(validateRecord('bank', 'x', {balance: '12a'}).error);
  assert.ok(validateRecord('lent', 'x', {date: '1/2/2026'}).error);
});

test('every kind has a group, a label and unique field ids', () => {
  for (const k of VAULT_KINDS) {
    assert.ok(k.group && k.label && k.fields.length, k.id);
    assert.equal(new Set(k.fields.map((x) => x.id)).size, k.fields.length, k.id);
  }
});

test('quiet months move a case: active, three reminders, then a call to the nominee', () => {
  assert.deepEqual(quietStage(3), {stage: 'active', reminder: 0});
  assert.deepEqual(quietStage(4), {stage: 'reminding', reminder: 1});
  assert.deepEqual(quietStage(5), {stage: 'reminding', reminder: 2});
  assert.deepEqual(quietStage(6), {stage: 'reminding', reminder: 3});
  assert.deepEqual(quietStage(7), {stage: 'call-nominee', reminder: 3});
});
