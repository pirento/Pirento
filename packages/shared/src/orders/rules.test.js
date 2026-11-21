import {test} from 'node:test';
import assert from 'node:assert/strict';
import {checkoutQuestions, validateFulfilment, validateIntake} from './rules.js';

const valid = (product, slug) =>
  Object.fromEntries(
    checkoutQuestions(product, slug).map((q) => [q.id, q.options?.[0] ?? (q.pattern ? '9876500000' : 'note')]),
  );

test('accepts a full answer set and drops unknown keys', () => {
  const {answers, error} = validateIntake('legal', 'gst-registration', {
    ...valid('legal', 'gst-registration'),
    evil: 'x',
  });
  assert.equal(error, undefined);
  assert.equal(answers.evil, undefined);
  assert.equal(answers.turnover, 'Under ₹20 lakh');
});

test('rejects bad phone, off-list choice and missing choice', () => {
  const base = valid('black', 'black-gst');
  assert.match(validateIntake('black', 'black-gst', {...base, phone: '12345'}).error, /phone/);
  assert.match(validateIntake('black', 'black-gst', {...base, practice: 'Hacker'}).error, /Choose/);
  assert.match(validateIntake('black', 'black-gst', {phone: base.phone}).error, /Choose/);
});

test('gift orders need a recipient, address and valid PIN', () => {
  const base = valid('giftox', 'giftox-welcome-kit');
  assert.equal(validateIntake('giftox', 'giftox-welcome-kit', {...base, pincode: '110001'}).error, undefined);
  assert.match(validateIntake('giftox', 'giftox-welcome-kit', {...base, address: ''}).error, /Delivery address/);
  assert.match(validateIntake('giftox', 'giftox-welcome-kit', {...base, pincode: '012345'}).error, /pin code/i);
});

test('delivery records: Green needs a real date and coordinates, Giftox a courier and tracking number', () => {
  const green = {site: 'Ajmer', plantedOn: '2026-11-20', lat: '26.4499', lng: '74.6399'};
  assert.deepEqual(validateFulfilment('green', {...green, extra: 'x'}), {answers: green});
  assert.ok(validateFulfilment('green', {...green, plantedOn: '2026-13-01'}).error);
  assert.ok(validateFulfilment('green', {...green, lat: 'north'}).error);
  assert.equal(
    validateFulfilment('giftox', {courier: 'Delhivery', tracking: 'AWB 1'}).error,
    'Enter a valid tracking number (AWB)',
  );
  assert.ok(validateFulfilment('giftox', {courier: 'Delhivery', tracking: 'DL1234'}).answers);
  assert.ok(validateFulfilment('legal', {}).error);
});
