// Checks the credit arithmetic: growth over time, rounding in Pirento's favour neither way, and display.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {costOf, credits, grownUnits} from './credits.js';

test('trees grow credits by rate and time', () => {
  const from = new Date('2026-01-01T00:00:00Z');
  const year = new Date(from.getTime() + 365.25 * 86_400_000);
  assert.equal(grownUnits(10, 0.025, from, year), 25); // 0.25 credit
  assert.equal(grownUnits(10, 0.025, year, from), 0); // time never runs backwards
  assert.equal(grownUnits(10, 0, from, year), 0); // no rate set, nothing grows
});

test('a buyer pays rounded up, a seller is paid rounded down', () => {
  assert.equal(costOf(1, 124_550, 'buy'), 1246);
  assert.equal(costOf(1, 124_550, 'sell'), 1245);
  assert.equal(costOf(100, 124_550, 'buy'), 124_550);
});

test('units show as credits', () => assert.equal(credits(1234), '12.34'));
