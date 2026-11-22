import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ID_SECTIONS} from '@pirento/shared';
import {nextStep} from './reminders.js';

const all = Object.fromEntries(ID_SECTIONS.map((s) => [s.id, {}]));

test('the next step follows the application order', () => {
  assert.equal(nextStep({}), ID_SECTIONS[0].title);
  assert.equal(nextStep({sections: all}), 'Video KYC');
  assert.equal(nextStep({sections: all, digio: {kycStatus: 'approved'}}), 'Sign the declaration');
  assert.equal(nextStep({sections: all, digio: {kycStatus: 'approved', docStatus: 'signed'}}), 'Set your PIN');
  assert.equal(
    nextStep({sections: all, digio: {kycStatus: 'approved', docStatus: 'signed'}, pin: {hash: 'x'}}),
    'Review and submit',
  );
});
