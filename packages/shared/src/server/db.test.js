// The staff search box: numbers, text, escaping, empty.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {searchFilter} from './db.js';

test('a number or #number finds the record number', () => {
  assert.deepEqual(searchFilter(' #100031 ', 'orderNo', ['email']), {orderNo: 100031});
});

test('text matches every field, escaped', () => {
  const f = searchFilter('a.b(', 'orderNo', ['email', 'serviceName']);
  assert.equal(f.$or.length, 2);
  assert.equal(f.$or[0].email.$regex, 'a\\.b\\(');
  assert.ok(!new RegExp(f.$or[0].email.$regex).test('axb'));
});

test('empty is no filter', () => {
  assert.equal(searchFilter('  ', 'orderNo', ['email']), null);
  assert.equal(searchFilter(undefined, 'orderNo', ['email']), null);
});
