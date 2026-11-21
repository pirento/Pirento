// Razorpay (card and UPI): creating its orders and checking its signatures, for orders and wallet top-ups.
// Read lazily so tests and dev can run without keys. No keys = Razorpay off.
import crypto from 'node:crypto';
import {safeEqual} from './internal.js';

export const razorpayConfig = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const url = process.env.RAZORPAY_URL || 'https://api.razorpay.com'; // a stand-in server in local tests
  return keyId && keySecret ? {keyId, keySecret, url, webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET} : null;
};

const hmac = (secret, data) => crypto.createHmac('sha256', secret).update(data).digest('hex');

/** Checkout callback: signature = HMAC(order_id|payment_id, key secret). */
export const checkoutSignatureOk = (secret, {razorpay_order_id, razorpay_payment_id, razorpay_signature}) =>
  safeEqual(hmac(secret, `${razorpay_order_id}|${razorpay_payment_id}`), razorpay_signature);

/** Webhook: signature = HMAC(exact raw body, webhook secret). */
export const webhookSignatureOk = (secret, rawBody, signature) =>
  Boolean(secret && rawBody) && safeEqual(hmac(secret, rawBody), signature);

export async function createRazorpayOrder({keyId, keySecret, url}, amount, receipt) {
  const res = await fetch(`${url}/v1/orders`, {
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

/**
 * Refunds a captured payment in full. `key` is Razorpay's idempotency key: a retry with the same key returns the
 * same refund instead of making a second one. A payment refunded already (by an earlier key, or by hand in the
 * dashboard) counts as done and comes back as {id: null}.
 */
export async function refundPayment({keyId, keySecret, url}, paymentId, key) {
  const res = await fetch(`${url}/v1/payments/${encodeURIComponent(paymentId)}/refund`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
      'x-refund-idempotency': key,
    },
    body: JSON.stringify({speed: 'normal', notes: {ref: key}}),
    signal: AbortSignal.timeout(15_000),
  });
  const body = await res.json().catch(() => ({}));
  if (res.ok) return body;
  const why = body.error?.description ?? '';
  if (res.status === 400 && /fully refunded/i.test(why)) return {id: null, status: 'processed'};
  throw Object.assign(new Error(`Razorpay refund failed${why ? `: ${why}` : ''}`), {
    status: 502,
    code: 'REFUND_FAILED',
  });
}
