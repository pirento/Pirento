// Payout helpers: what each status means, the request we send, refusals vs outages, webhook signatures.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {PayoutRefused, createPayout, outcomeOf, webhookSignatureOk} from './payouts.js';

const cfg = {keyId: 'k', keySecret: 's', account: '2323230000000000', baseUrl: 'http://x'};
const w = {_id: 'abc123', amount: 15000, upi: 'asha@okbank', email: 'a@example.com', userId: 'u1'};

test('statuses map to paid, returned or pending', () => {
  assert.equal(outcomeOf('processed'), 'paid');
  for (const s of ['reversed', 'failed', 'rejected', 'cancelled']) assert.equal(outcomeOf(s), 'returned');
  for (const s of ['queued', 'pending', 'processing', 'scheduled']) assert.equal(outcomeOf(s), 'pending');
});

test('the payout carries the idempotency key, paise and the UPI ID', async () => {
  let seen;
  const fake = async (url, init) => {
    seen = {url, init, body: JSON.parse(init.body)};
    return new Response(JSON.stringify({id: 'pout_1', status: 'processing'}), {status: 200});
  };
  const p = await createPayout(cfg, w, fake);
  assert.equal(p.id, 'pout_1');
  assert.equal(seen.url, 'http://x/v1/payouts');
  assert.equal(seen.init.headers['X-Payout-Idempotency'], 'wd-abc123');
  assert.equal(seen.body.amount, 15000);
  assert.equal(seen.body.mode, 'UPI');
  assert.equal(seen.body.fund_account.vpa.address, 'asha@okbank');
  assert.equal(seen.body.reference_id, 'abc123');
});

test('a 4xx is a refusal; a 5xx is unknown', async () => {
  const answer = (status) => async () => new Response(JSON.stringify({error: {description: 'bad vpa'}}), {status});
  await assert.rejects(
    createPayout(cfg, w, answer(400)),
    (e) => e instanceof PayoutRefused && /bad vpa/.test(e.message),
  );
  await assert.rejects(createPayout(cfg, w, answer(503)), (e) => !(e instanceof PayoutRefused));
});

test('webhook signatures', () => {
  const body = Buffer.from('{"event":"payout.processed"}');
  const sig = crypto.createHmac('sha256', 'sec').update(body).digest('hex');
  assert.ok(webhookSignatureOk('sec', body, sig));
  assert.ok(!webhookSignatureOk('sec', body, 'nope'));
  assert.ok(!webhookSignatureOk(undefined, body, sig));
});
