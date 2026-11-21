import {test} from 'node:test';
import assert from 'node:assert/strict';
import {checkoutQuestions, needsDetails, validateFulfilment, validateIntake} from './rules.js';

const svc = (product, slug, extra) => ({product, slug, ...extra});

const valid = (product, slug) =>
  Object.fromEntries(
    checkoutQuestions(product, slug).map((q) => [q.id, q.options?.[0] ?? (q.pattern ? '9876500000' : 'note')]),
  );

test('accepts a full answer set and drops unknown keys', () => {
  const {answers, error} = validateIntake(svc('legal', 'gst-registration'), {
    ...valid('legal', 'gst-registration'),
    evil: 'x',
  });
  assert.equal(error, undefined);
  assert.equal(answers.evil, undefined);
  assert.equal(answers.turnover, 'Under ₹20 lakh');
});

test('rejects bad phone, off-list choice and missing choice', () => {
  const base = valid('black', 'black-gst');
  assert.match(validateIntake(svc('black', 'black-gst'), {...base, phone: '12345'}).error, /phone/);
  assert.match(validateIntake(svc('black', 'black-gst'), {...base, practice: 'Hacker'}).error, /Choose/);
  assert.match(validateIntake(svc('black', 'black-gst'), {phone: base.phone}).error, /Choose/);
});

test('gift orders need a recipient, address and valid PIN', () => {
  const base = valid('giftox', 'giftox-welcome-kit');
  assert.equal(validateIntake(svc('giftox', 'giftox-welcome-kit'), {...base, pincode: '110001'}).error, undefined);
  assert.match(validateIntake(svc('giftox', 'giftox-welcome-kit'), {...base, address: ''}).error, /Delivery address/);
  assert.match(validateIntake(svc('giftox', 'giftox-welcome-kit'), {...base, pincode: '012345'}).error, /pin code/i);
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

test("a service's own questions replace the defaults, but phone is always asked", () => {
  const questions = [
    {id: 'companyName', label: 'Proposed company name', required: true},
    {id: 'plan', label: 'Which plan?', options: ['Basic', 'Full']},
  ];
  const service = svc('legal', 'legal-startup-pack', {questions});
  assert.deepEqual(validateIntake(service, {phone: '9876500000', companyName: 'Acme', plan: 'Full', state: 'Goa'}), {
    answers: {phone: '9876500000', companyName: 'Acme', plan: 'Full'},
  });
  assert.match(validateIntake(service, {phone: '9876500000', plan: 'Full'}).error, /Proposed company name/);
  assert.match(validateIntake(service, {companyName: 'Acme', plan: 'Full'}).error, /phone/);
});

test('an order waits on after-payment answers only while live and unanswered', () => {
  const order = {status: 'paid', afterQuestions: [{id: 'pan', label: 'PAN'}]};
  assert.equal(needsDetails(order), true);
  assert.equal(needsDetails({...order, detailsAt: new Date()}), false);
  assert.equal(needsDetails({...order, status: 'pending_payment'}), false);
  assert.equal(needsDetails({...order, afterQuestions: []}), false);
});
