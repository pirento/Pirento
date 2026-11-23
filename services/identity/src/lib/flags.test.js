import {test} from 'node:test';
import assert from 'node:assert/strict';
import {flagsFor, lookalikes} from './flags.js';

const doc = {
  _id: 'a',
  userId: 'u1',
  sections: {
    documents: {pan: 'ABCDE1234F', aadhaar: 'XXXX XXXX 1234'},
    contact: {mobile: '9876543210'},
    personal: {dob: '2000-01-01'},
  },
};

test('flags the same PAN, mobile, or Aadhaar ending with birth date on another person', () => {
  const other = {_id: 'b', userId: 'u2', status: 'approved', bharatId: '1234567890', sections: doc.sections};
  assert.deepEqual(
    flagsFor(doc, [other]).map((f) => f.flag),
    ['Same PAN', 'Same mobile', 'Same Aadhaar ending and birth date'],
  );
  assert.equal(flagsFor(doc, [{...other, userId: 'u1'}]).length, 0); // the same person's own older application
  assert.equal(lookalikes(doc).$or.length, 3);
  assert.equal(lookalikes({_id: 'x'}), null);
});
