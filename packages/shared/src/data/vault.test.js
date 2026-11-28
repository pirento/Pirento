// Tests for vault.js: record checks and the check-in stages.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DEATH_ISSUERS, VAULT_KINDS, deathIssuer, namesMatch, netWorth, quietStage, validateRecord} from './vault.js';

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

test('a certificate name matches the owner by words and initials, ignoring titles', () => {
  assert.ok(namesMatch('Late Shri R. K. Verma', 'Ravi Kumar Verma'));
  assert.ok(namesMatch('RAVI KUMAR VERMA', 'Ravi Kumar Verma'));
  assert.ok(!namesMatch('Ravi Kumar Sharma', 'Ravi Kumar Verma'));
  assert.ok(!namesMatch('', 'Ravi Verma'));
  for (const i of DEATH_ISSUERS) assert.ok(i.params.length && deathIssuer(i.id) === i, i.id);
});

test('net worth adds assets, takes away debts and keeps cover apart', () => {
  const n = netWorth([
    {kind: 'bank', title: 'SBI', fields: {balance: '25000.50'}},
    {kind: 'mutual-fund', title: 'Index', fields: {value: '600'}},
    {kind: 'owed', title: 'Car loan', fields: {amount: '10000'}},
    {kind: 'insurance', title: 'Term', fields: {cover: '5000000'}},
    {kind: 'note', title: 'x', fields: {text: '9'}},
    {kind: 'bank', title: 'No balance', fields: {}},
  ]);
  assert.equal(n.assets, 25600.5);
  assert.equal(n.debts, 10000);
  assert.equal(n.net, 15600.5);
  assert.equal(n.cover, 5000000);
  assert.equal(n.items.length, 4);
  assert.equal(n.byKind.bank, 25000.5);
  assert.equal(n.byKind.insurance, undefined);
});
