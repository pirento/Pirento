// Checks who gets a notice on which channel: admin's switches, the person's choices, WhatsApp opt-in, important events.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {noticeEvent} from '@pirento/shared';
import {plan} from './notices.js';

const ready = {dashboard: true, email: true, sms: true, whatsapp: true};
const on = (event) => ({channels: {dashboard: true, email: true, sms: true, whatsapp: true}, ...event});

test('everything on, opted in: every channel', () => {
  const user = {phone: '+919876500000', noticePrefs: {whatsapp: true}};
  assert.deepEqual(plan(noticeEvent('order.update'), on(), user, ready), {
    dashboard: true,
    email: true,
    sms: true,
    whatsapp: true,
  });
});

test('WhatsApp needs opt-in and a mobile; admin and setup switch channels off', () => {
  const r = plan(
    noticeEvent('order.update'),
    on({channels: {dashboard: true, email: false, sms: true, whatsapp: true}}),
    {},
    {...ready, sms: false},
  );
  assert.equal(r.email, 'off for this event');
  assert.equal(r.sms, 'channel not set up');
  assert.equal(r.whatsapp, 'no mobile on the account');
  const noOptIn = plan(noticeEvent('order.update'), on(), {phone: '+919876500000'}, ready);
  assert.equal(noOptIn.whatsapp, 'not opted in to WhatsApp');
});

test("a person's switches and mutes do not stop important notices", () => {
  const user = {
    phone: '+919876500000',
    noticePrefs: {email: false, sms: false, whatsapp: true, muted: ['wallet', 'giftox']},
  };
  const money = plan(noticeEvent('withdrawal.update'), on(), user, ready);
  assert.deepEqual([money.email, money.sms, money.whatsapp], [true, true, true]);
  const parcel = plan(noticeEvent('shipment.update'), on(), user, ready);
  assert.equal(parcel.email, 'product muted');
  assert.equal(parcel.dashboard, true);
});
