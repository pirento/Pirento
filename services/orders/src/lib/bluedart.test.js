// Checks that an address fits Blue Dart's three 30-character lines without losing words early on.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {addressLines} from './bluedart.js';

test('an address splits on words into at most three lines of 30', () => {
  const lines = addressLines('Flat 12, Shanti Apartments, Near City Hospital, MG Road, Sector 14, Gurugram');
  assert.ok(lines.length <= 3 && lines.every((l) => l.length <= 30));
  assert.equal(lines[0], 'Flat 12, Shanti Apartments,');
  assert.deepEqual(addressLines('12 MG Road'), ['12 MG Road']);
});
