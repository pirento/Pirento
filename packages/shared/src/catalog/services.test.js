import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SERVICES, getService, PRODUCTS} from '../index.js';

test('every service has a unique slug and a known product', () => {
  const slugs = SERVICES.map((s) => s.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  const products = new Set(PRODUCTS.map((p) => p.slug));
  for (const s of SERVICES) assert.ok(products.has(s.product), s.slug);
});

test('priced services carry a positive whole-rupee price', () => {
  assert.equal(getService('private-limited-company').price, 1999);
  for (const s of SERVICES) if (s.price !== null) assert.ok(Number.isInteger(s.price) && s.price > 0, s.slug);
});
