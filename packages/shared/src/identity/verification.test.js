import {test} from 'node:test';
import assert from 'node:assert/strict';
import {declarationSigned, kycDone, kycFailed} from './verification.js';

test('reads Digio statuses', () => {
  assert.equal(kycDone({digio: {kycStatus: 'approval_pending'}}), true);
  assert.equal(kycDone({digio: {kycStatus: 'requested'}}), false);
  assert.equal(kycDone(null), false);
  assert.equal(kycFailed({digio: {kycStatus: 'expired'}}), true);
  assert.equal(declarationSigned({digio: {docStatus: 'signed'}}), true);
});
