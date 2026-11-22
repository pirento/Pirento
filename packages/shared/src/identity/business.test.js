import {test} from 'node:test';
import assert from 'node:assert/strict';
import {BUSINESS_PROFILE, BUSINESS_REQUEST, TEST_BHARAT_IDS} from './business.js';
import {isBharatId} from './bharatId.js';
import {validateFields} from './form.js';

const request = {
  company: 'Asha Bank',
  type: 'Bank',
  website: 'https://ashabank.example',
  contactName: 'Asha Rao',
  designation: 'Head of KYC',
  email: 'Asha@AshaBank.example',
  mobile: '9876500000',
  useCase: 'KYC for new accounts',
  volume: 'Under 1,000',
};

test('a request checks every field and lower-cases the email', () => {
  assert.equal(validateFields(BUSINESS_REQUEST.fields, request).data.email, 'asha@ashabank.example');
  assert.equal(validateFields(BUSINESS_REQUEST.fields, {...request, website: 'ashabank'}).field, 'website');
  assert.equal(validateFields(BUSINESS_REQUEST.fields, {...request, type: 'Bakery'}).field, 'type');
});

test('company details check PAN and the optional GSTIN', () => {
  const profile = {
    legalName: 'Asha Bank Ltd',
    entity: 'Public limited company',
    registrationNo: 'u12345mh2020plc123456',
    pan: 'aaacb1234c',
    line: '1 Main Road',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    signatoryName: 'Asha Rao',
    signatoryDesignation: 'Director',
  };
  const ok = validateFields(BUSINESS_PROFILE.fields, profile);
  assert.equal(ok.data.pan, 'AAACB1234C');
  assert.equal(ok.data.gstin, undefined);
  assert.equal(
    validateFields(BUSINESS_PROFILE.fields, {...profile, gstin: '27AAACB1234C1ZX'}).data.gstin,
    '27AAACB1234C1ZX',
  );
  assert.equal(validateFields(BUSINESS_PROFILE.fields, {...profile, gstin: 'nope'}).field, 'gstin');
});

test('sandbox IDs are valid Bharat IDs', () => {
  for (const id of Object.values(TEST_BHARAT_IDS)) assert.ok(isBharatId(id), id);
});
