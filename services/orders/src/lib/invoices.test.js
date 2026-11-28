// Checks how an invoice is worked out: tax or plain, CGST + SGST within Uttar Pradesh, IGST across states, and the
// place of supply for goods and for services.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildInvoice} from './invoices.js';

const settings = {
  address: 'Registered office, Lucknow',
  prefix: 'PIR',
  products: {legal: {code: '998213', rate: 18}, giftox: {code: '9803', rate: 12}},
};
const order = (o) => ({
  _id: 'o1',
  orderNo: 100001,
  userId: 'u1',
  email: 'a@example.com',
  serviceName: 'GST registration',
  amount: 118000,
  payment: {method: 'wallet'},
  intake: {},
  ...o,
});

test('a service in the seller state: CGST and SGST, from the price paid', () => {
  const inv = buildInvoice({order: order({product: 'legal', intake: {state: 'Uttar Pradesh'}}), settings});
  assert.equal(inv.kind, 'tax');
  assert.deepEqual(inv.amounts, {taxable: 100000, cgst: 9000, sgst: 9000, igst: 0, total: 118000});
  assert.equal(inv.placeOfSupply.state, 'Uttar Pradesh');
  assert.equal(inv.line.code, '998213');
  assert.equal(inv.line.codeType, 'SAC');
});

test("a service for a buyer in another state: IGST; billing details beat the form's state", () => {
  const inv = buildInvoice({
    order: order({product: 'legal', intake: {state: 'Uttar Pradesh'}}),
    settings,
    billing: {name: 'Acme Pvt Ltd', gstin: '27ABCDE1234F1Z5', state: 'Maharashtra'},
  });
  assert.equal(inv.placeOfSupply.state, 'Maharashtra');
  assert.equal(inv.amounts.igst, 18000);
  assert.equal(inv.buyer.gstin, '27ABCDE1234F1Z5');
  assert.equal(inv.buyer.name, 'Acme Pvt Ltd');
});

test('goods go where they are delivered, with an HSN code', () => {
  const inv = buildInvoice({
    order: order({product: 'giftox', amount: 112000, intake: {state: 'Delhi', recipientName: 'Ravi'}}),
    settings,
    billing: {state: 'Uttar Pradesh'},
  });
  assert.equal(inv.placeOfSupply.state, 'Delhi');
  assert.equal(inv.line.codeType, 'HSN');
  assert.equal(inv.shipTo.name, 'Ravi');
  assert.equal(inv.shipTo.state, 'Delhi');
  assert.deepEqual(inv.amounts, {taxable: 100000, cgst: 0, sgst: 0, igst: 12000, total: 112000});
});

test('without a code and rate, or without the seller address, the invoice is plain', () => {
  assert.equal(buildInvoice({order: order({product: 'green'}), settings}).kind, 'plain');
  const plain = buildInvoice({order: order({product: 'legal'}), settings: {...settings, address: ''}});
  assert.equal(plain.kind, 'plain');
  assert.deepEqual(plain.amounts, {taxable: 118000, cgst: 0, sgst: 0, igst: 0, total: 118000});
  // No state anywhere: the supply is in the seller's own state.
  assert.equal(buildInvoice({order: order({product: 'legal'}), settings}).placeOfSupply.code, '09');
});
