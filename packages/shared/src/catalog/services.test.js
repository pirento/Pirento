// Tests for services.js.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {
  SERVICES,
  getService,
  PRODUCTS,
  editedService,
  editedServicesFor,
  basePrice,
  packageOf,
  packagesOf,
  servicePage,
  servicesFor,
  LEGAL_PAGES,
} from '../index.js';

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

test("admin edits: a new price, off sale, and a service made in admin with its product's prefix", () => {
  const edits = {
    'gst-registration': {price: 1199, questions: [{id: 'q', label: 'Q?', options: ['a', 'b']}]},
    'itr-filing': {offSale: true},
    'legal-startup-pack': {custom: {product: 'legal', name: 'Startup pack', category: 'Packages', price: 4999}},
  };
  assert.equal(editedService('gst-registration', edits).price, 1199);
  assert.equal(editedService('gst-registration', edits).questions.length, 1);
  assert.equal(editedService('itr-filing', edits).price, null);
  assert.equal(editedService('legal-startup-pack', edits).product, 'legal');
  assert.equal(editedService('nothing-here', edits), null);
  assert.ok(editedServicesFor('legal', edits).some((s) => s.slug === 'legal-startup-pack'));
  assert.ok(!editedServicesFor('black', edits).some((s) => s.slug === 'legal-startup-pack'));
  assert.equal(basePrice('gst-registration', edits), getService('gst-registration').price);
  assert.equal(
    basePrice('legal-startup-pack', {...edits, 'legal-startup-pack': {...edits['legal-startup-pack'], price: 10}}),
    4999,
  );
});

test('packages: cheapest first, picked by id, a price change moves the cheapest, admin packages win', () => {
  const pvt = getService('private-limited-company');
  assert.deepEqual(
    packagesOf(pvt).map((p) => p.id),
    ['basic', 'standard', 'premium'],
  );
  assert.equal(packageOf(pvt).id, 'basic');
  assert.equal(packageOf(pvt, 'premium').price, 9999);
  assert.equal(packageOf(pvt, 'nope'), null);
  assert.equal(packagesOf(getService('dsc'))[0].price, getService('dsc').price);
  assert.equal(editedService('private-limited-company', {'private-limited-company': {price: 2499}}).price, 2499);
  const own = {'private-limited-company': {packages: [{id: 'one', name: 'One', price: 3000, includes: []}]}};
  assert.equal(editedService('private-limited-company', own).price, 3000);
  assert.deepEqual(
    packagesOf(editedService('private-limited-company', {'private-limited-company': {offSale: true}})),
    [],
  );
  assert.equal(servicePage('private-limited-company').documents.length > 0, true);
  assert.deepEqual(servicePage('private-limited-company', {documents: []}).documents, []);
});

test('every Legal service has a full page', () => {
  for (const s of servicesFor('legal')) {
    const p = servicePage(s.slug);
    for (const k of ['intro', 'documents', 'steps', 'faqs', 'costs', 'deliverables'])
      assert.ok(p[k].length, `${s.slug} ${k}`);
  }
  assert.ok(
    Object.keys(LEGAL_PAGES).every((slug) => getService(slug)),
    'a page for an unknown slug',
  );
});
