import {test} from 'node:test';
import assert from 'node:assert/strict';
import {publicName} from './publicName.js';

test('public name keeps the first name and one initial', () => {
  assert.equal(publicName('Asha Rani Verma'), 'Asha V.');
  assert.equal(publicName('  Asha  '), 'Asha');
});
