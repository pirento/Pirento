import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateSection} from './form.js';
import {verhoeffCheckDigit} from './bharatId.js';

const aadhaar = (body) => body + verhoeffCheckDigit(body);

test('Aadhaar: checksum enforced, only last 4 kept', () => {
  const good = aadhaar('23456789012');
  const r = validateSection('documents', {
    pan: 'abcde1234f',
    aadhaar: `${good.slice(0, 4)} ${good.slice(4, 8)} ${good.slice(8)}`,
  });
  assert.equal(r.error, undefined);
  assert.equal(r.data.pan, 'ABCDE1234F');
  assert.equal(r.data.aadhaar, `XXXX XXXX ${good.slice(-4)}`);
  const bad = good.slice(0, 11) + ((Number(good[11]) + 1) % 10);
  assert.match(validateSection('documents', {pan: 'ABCDE1234F', aadhaar: bad}).error, /Aadhaar/);
});

test('bank account reduced to last 4; UPI optional but checked', () => {
  const base = {bankName: 'SBI', account: '123456789012', ifsc: 'sbin0001234'};
  assert.equal(validateSection('bank', base).data.account, '••••9012');
  assert.equal(validateSection('bank', base).data.ifsc, 'SBIN0001234');
  assert.match(validateSection('bank', {...base, upi: 'bad'}).error, /upi/i);
  assert.equal(validateSection('bank', {...base, upi: 'asha@okhdfc'}).data.upi, 'asha@okhdfc');
});

test('adult check, names, options, unknown step', () => {
  const p = {fullName: 'Asha Verma', fatherName: 'Ravi Verma', dob: '1990-05-01', gender: 'Female'};
  assert.equal(validateSection('personal', p).error, undefined);
  assert.match(validateSection('personal', {...p, dob: '2015-01-01'}).error, /18/);
  assert.match(validateSection('personal', {...p, fullName: 'A1'}).error, /full name/);
  assert.match(validateSection('personal', {...p, gender: 'X'}).error, /gender/);
  assert.match(validateSection('nope', {}).error, /Unknown/);
});
