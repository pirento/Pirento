// Checks the Code 128 table's shape and a known encoding.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CODE128, code128} from './barcode.js';

test('every symbol is 11 modules (the stop 13) and none repeats', () => {
  assert.equal(CODE128.SYMBOLS.length, 107);
  CODE128.SYMBOLS.forEach((s, i) => {
    const sum = [...s].map(Number).reduce((a, b) => a + b, 0);
    assert.equal(sum, i === CODE128.STOP ? 13 : 11, `symbol ${i}`);
  });
  assert.equal(new Set(CODE128.SYMBOLS).size, 107);
});

test('a waybill encodes start B, its characters, the mod-103 check and stop', () => {
  const bars = code128('70000000001');
  assert.equal(
    bars.reduce((a, b) => a + b, 0),
    13 * 11 + 13,
  ); // start + 11 digits + check, then stop
  assert.deepEqual(bars.slice(0, 6), [2, 1, 1, 2, 1, 4]); // start B
  assert.deepEqual(bars.slice(-7), [2, 3, 3, 1, 1, 1, 2]); // stop
  // '7' is value 23 in set B: the second symbol.
  assert.deepEqual(bars.slice(6, 12), [...CODE128.SYMBOLS[23]].map(Number));
  // The check symbol: (104 + Σ value × position) mod 103.
  const check = [...'70000000001'].reduce((s, c, i) => s + (c.charCodeAt(0) - 32) * (i + 1), 104) % 103;
  assert.deepEqual(bars.slice(-13, -7), [...CODE128.SYMBOLS[check]].map(Number));
  assert.equal(code128('é'), null);
});
