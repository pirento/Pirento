// Tests for invoice.js: GST splits that always add up, the financial year, words and states.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {amountInWords, financialYear, gstState, isGstin, splitTax, stateOfGstin} from './invoice.js';

test('GST inside a price splits into taxable value and tax that add back up', () => {
  assert.deepEqual(splitTax(118000, 18, true), {taxable: 100000, cgst: 9000, sgst: 9000, igst: 0, total: 118000});
  assert.deepEqual(splitTax(118000, 18, false), {taxable: 100000, cgst: 0, sgst: 0, igst: 18000, total: 118000});
  for (const amount of [149900, 99, 1, 249950]) {
    for (const rate of [0, 5, 12, 18, 28]) {
      const s = splitTax(amount, rate, true);
      assert.equal(s.taxable + s.cgst + s.sgst + s.igst, amount, `${amount} at ${rate}%`);
      assert.ok(Math.abs(s.cgst - s.sgst) <= 1);
    }
  }
  assert.equal(splitTax(149900, 0, true).taxable, 149900);
});

test('the financial year turns in April, India time', () => {
  assert.equal(financialYear(new Date('2026-03-31T18:00:00Z')), '25-26'); // 11:30 pm on 31 March in India
  assert.equal(financialYear(new Date('2026-03-31T18:31:00Z')), '26-27'); // just past midnight, 1 April
  assert.equal(financialYear(new Date('2027-01-15T00:00:00Z')), '26-27');
});

test('amounts in Indian words', () => {
  assert.equal(amountInWords(149900), 'Rupees One Thousand Four Hundred Ninety Nine Only');
  assert.equal(amountInWords(25000000050), 'Rupees Twenty Five Crore and Fifty Paise Only');
  assert.equal(
    amountInWords(12345678),
    'Rupees One Lakh Twenty Three Thousand Four Hundred Fifty Six and Seventy Eight Paise Only',
  );
  assert.equal(amountInWords(0), 'Rupees Zero Only');
});

test('states by name or code, and from a GSTIN', () => {
  assert.equal(gstState('uttar pradesh').code, '09');
  assert.equal(gstState('Dadra & Nagar Haveli and Daman & Diu').code, '26');
  assert.equal(gstState('07').name, 'Delhi');
  assert.equal(gstState('Atlantis'), null);
  assert.ok(isGstin('09AAJCV6240P1ZL'));
  assert.equal(stateOfGstin('09AAJCV6240P1ZL').name, 'Uttar Pradesh');
  assert.equal(stateOfGstin('nope'), null);
});
