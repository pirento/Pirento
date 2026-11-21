// RazorpayX payouts: sending a withdrawal to a UPI ID through the API, and reading its fate.
// Read lazily so dev and tests run without keys. No keys = payouts by hand (finance notes the UTR).
import crypto from 'node:crypto';
import {safeEqual} from '@pirento/shared/server';

export const payoutConfig = () => {
  const {RAZORPAYX_KEY_ID: keyId, RAZORPAYX_KEY_SECRET: keySecret, RAZORPAYX_ACCOUNT_NUMBER: account} = process.env;
  if (!keyId || !keySecret || !account) return null;
  return {
    keyId,
    keySecret,
    account,
    webhookSecret: process.env.RAZORPAYX_WEBHOOK_SECRET,
    // Only tests point this elsewhere.
    baseUrl: process.env.RAZORPAYX_URL ?? 'https://api.razorpay.com',
  };
};

/** What a payout status means for the withdrawal: sent, returned, or still on its way. */
export function outcomeOf(status) {
  if (status === 'processed') return 'paid';
  if (['reversed', 'failed', 'rejected', 'cancelled'].includes(status)) return 'returned';
  return 'pending'; // queued, pending, scheduled, processing
}

const auth = (cfg) => `Basic ${Buffer.from(`${cfg.keyId}:${cfg.keySecret}`).toString('base64')}`;

/** A refusal from RazorpayX itself (4xx): the payout was not created, so the request can go back to finance. */
export class PayoutRefused extends Error {}

async function call(cfg, path, init, fetchImpl) {
  const res = await fetchImpl(cfg.baseUrl + path, {
    ...init,
    headers: {'content-type': 'application/json', authorization: auth(cfg), ...init.headers},
    signal: AbortSignal.timeout(15_000),
  });
  const json = await res.json().catch(() => ({}));
  if (res.status >= 400 && res.status < 500) {
    throw new PayoutRefused(json.error?.description ?? `RazorpayX refused the payout (${res.status})`);
  }
  // 5xx: we cannot know whether it was created. The caller keeps it as processing and asks again later.
  if (!res.ok) throw new Error(`RazorpayX is not answering (${res.status})`);
  return json;
}

/**
 * Creates the payout. The idempotency key is the withdrawal's id, so asking again (a retry, a double
 * click, a crash between the call and our save) returns the same payout instead of paying twice.
 */
export function createPayout(cfg, w, fetchImpl = fetch) {
  return call(
    cfg,
    '/v1/payouts',
    {
      method: 'POST',
      headers: {'X-Payout-Idempotency': `wd-${w._id}`},
      body: JSON.stringify({
        account_number: cfg.account,
        amount: w.amount, // paise, as stored
        currency: 'INR',
        mode: 'UPI',
        purpose: 'refund',
        queue_if_low_balance: true,
        reference_id: String(w._id),
        narration: 'Pirento withdrawal',
        fund_account: {
          account_type: 'vpa',
          vpa: {address: w.upi},
          contact: {name: 'Pirento customer', email: w.email, type: 'customer', reference_id: w.userId.slice(0, 40)},
        },
      }),
    },
    fetchImpl,
  );
}

export const fetchPayout = (cfg, id, fetchImpl = fetch) =>
  call(cfg, `/v1/payouts/${encodeURIComponent(id)}`, {method: 'GET'}, fetchImpl);

/** Webhook: signature = HMAC-SHA256(exact raw body, webhook secret), hex. */
export const webhookSignatureOk = (secret, rawBody, signature) =>
  Boolean(secret && rawBody) && safeEqual(crypto.createHmac('sha256', secret).update(rawBody).digest('hex'), signature);
