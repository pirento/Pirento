// Checks how an automatic parcel decides between booking itself and waiting for the team.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {reviewOf} from './shipments.js';

const intake = {recipientName: 'Ravi', address: '12 MG Road, Pune', pincode: '411001', phone: '9876500000'};

test('a clean address books by itself without the AI', () => {
  const {to, review} = reviewOf(intake);
  assert.deepEqual(review, []);
  assert.deepEqual(to, {name: 'Ravi', address: '12 MG Road, Pune', pincode: '411001', mobile: '9876500000'});
});

test("the AI's problems hold it back, and its PIN code fills a missing one", () => {
  const ai = {
    name: 'Ravi Kumar',
    address: '12 MG Road, Shivajinagar, Pune, Maharashtra',
    pincode: '411005',
    problems: [],
  };
  const {to, review} = reviewOf({...intake, pincode: ''}, ai);
  assert.equal(to.pincode, '411005');
  assert.equal(to.name, 'Ravi Kumar');
  assert.deepEqual(review, []);
  const held = reviewOf(intake, {...ai, problems: ['No house number']});
  assert.deepEqual(held.review, ['No house number']);
  assert.equal(held.to.pincode, '411001'); // the customer's own PIN code wins
});

test('the delivery state ends the address unless it is already there', () => {
  assert.equal(reviewOf({...intake, state: 'Maharashtra'}).to.address, '12 MG Road, Pune, Maharashtra');
  assert.equal(
    reviewOf({...intake, address: '12 MG Road, Pune, Maharashtra', state: 'Maharashtra'}).to.address,
    '12 MG Road, Pune, Maharashtra',
  );
});

test('plain checks catch what is missing', () => {
  const {review} = reviewOf({recipientName: '', address: 'Pune', pincode: '1234', phone: '12'});
  assert.deepEqual(review, [
    'No recipient name',
    'The address is too short',
    'No valid PIN code',
    'No valid mobile number',
  ]);
});
