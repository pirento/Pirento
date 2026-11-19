import crypto from 'node:crypto';
import {safeEqual} from '@pirento/shared/server';

// Read lazily so tests and dev can run without keys. No keys = Razorpay off.
export const razorpayConfig = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  return keyId && keySecret ? {keyId, keySecret, webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET} : null;
};

const hmac = (secret, data) => crypto.createHmac('sha256', secret).update(data).digest('hex');

/** Checkout callback: signature = HMAC(order_id|payment_id, key secret). */
export const checkoutSignatureOk = (secret, {razorpay_order_id, razorpay_payment_id, razorpay_signature}) =>
  safeEqual(hmac(secret, `${razorpay_order_id}|${razorpay_payment_id}`), razorpay_signature);

/** Webhook: signature = HMAC(exact raw body, webhook secret). */
export const webhookSignatureOk = (secret, rawBody, signature) =>
  Boolean(secret && rawBody) && safeEqual(hmac(secret, rawBody), signature);

export async function createRazorpayOrder({keyId, keySecret}, amount, receipt) {
  const res = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
    },
    body: JSON.stringify({amount, currency: 'INR', receipt}),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw Object.assign(new Error('Razorpay order failed'), {status: 502, code: 'GATEWAY_ERROR'});
  return res.json();
}
