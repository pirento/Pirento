// Checks Green certificate numbers: made from the order, read back from what people type, and never a Bharat ID.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {greenCertNo, hasGreenCert, parseGreenRef} from './greenCertificate.js';

test('numbers follow the kind of order', () => {
  assert.equal(greenCertNo({orderNo: 100021, serviceSlug: 'green-western-ghats'}), 'PG-100021');
  assert.equal(greenCertNo({orderNo: 100022, serviceSlug: 'green-donate'}), 'PF-100022');
});

test('typed references are read back', () => {
  assert.deepEqual(parseGreenRef('pg-100021'), {orderNo: 100021, donation: false});
  assert.deepEqual(parseGreenRef('PF100022'), {orderNo: 100022, donation: true});
  assert.deepEqual(parseGreenRef('#100023'), {orderNo: 100023, donation: null});
  assert.equal(parseGreenRef('4521876390'), null); // a Bharat ID
  assert.equal(parseGreenRef('GRN-7F3A9C21'), null);
});

test('a certificate needs the planting record', () => {
  assert.equal(hasGreenCert({product: 'green', fulfilment: {site: 'Sirsi'}}), true);
  assert.equal(hasGreenCert({product: 'green'}), false);
  assert.equal(hasGreenCert({product: 'legal', fulfilment: {site: 'x'}}), false);
});
