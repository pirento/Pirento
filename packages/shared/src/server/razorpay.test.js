// Tests for razorpay.js.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {checkoutSignatureOk, webhookSignatureOk} from './razorpay.js';

const sign = (secret, data) => crypto.createHmac('sha256', secret).update(data).digest('hex');

test('checkout signature: accepts the real one, rejects tampering', () => {
  const p = {razorpay_order_id: 'order_1', razorpay_payment_id: 'pay_1'};
  const good = {...p, razorpay_signature: sign('s3cret', 'order_1|pay_1')};
  assert.ok(checkoutSignatureOk('s3cret', good));
  assert.ok(!checkoutSignatureOk('s3cret', {...good, razorpay_payment_id: 'pay_2'}));
  assert.ok(!checkoutSignatureOk('other', good));
  assert.ok(!checkoutSignatureOk('s3cret', {...p}));
});

test('webhook signature covers the exact raw bytes', () => {
  const raw = Buffer.from('{"event":"payment.captured"}');
  assert.ok(webhookSignatureOk('wh', raw, sign('wh', raw)));
  assert.ok(!webhookSignatureOk('wh', Buffer.from('{"event": "payment.captured"}'), sign('wh', raw)));
  assert.ok(!webhookSignatureOk(undefined, raw, sign('wh', raw)));
});
