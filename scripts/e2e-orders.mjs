// End-to-end order flow against a running stack (npm run dev with SUPERADMIN_EMAILS=boss@example.com).
// Usage: npm run e2e
const B = process.env.API_URL ?? 'http://127.0.0.1:4000/api';
let ok = 0,
  bad = 0;
const check = (name, cond, extra) => (cond ? ok++ : (bad++, console.log('FAIL', name, extra ?? '')));
async function call(path, {method = 'GET', body, token, headers = {}} = {}) {
  const r = await fetch(B + path, {
    method,
    headers: {
      ...(body ? {'content-type': 'application/json'} : {}),
      ...(token ? {authorization: `Bearer ${token}`} : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return {status: r.status, ...(await r.json().catch(() => ({})))};
}
async function login(email) {
  const {data} = await call('/auth/otp/request', {method: 'POST', body: {email}});
  return (await call('/auth/otp/verify', {method: 'POST', body: {email, code: data.devCode}})).data.token;
}
const intake = {
  phone: '9876500000',
  applicantType: 'A new startup',
  state: 'Delhi',
  urgency: 'Standard timeline',
  existingSetup: 'None yet',
  turnover: 'Under ₹20 lakh',
};

const user = await login(`u${Date.now()}@example.com`);
const boss = await login('boss@example.com');

check(
  'bad intake rejected',
  (
    await call('/orders', {
      method: 'POST',
      token: user,
      body: {serviceSlug: 'gst-registration', intake: {...intake, state: 'Mars'}},
    })
  ).status === 400,
);
check(
  'unpriced service rejected',
  (await call('/orders', {method: 'POST', token: user, body: {serviceSlug: 'hsn-code-finder-xyz', intake}})).status ===
    400,
);
const o = (
  await call('/orders', {
    method: 'POST',
    token: user,
    body: {serviceSlug: 'gst-registration', intake: {...intake, evil: 'x'}},
  })
).data;
check('order priced by server', o?.amount === 99900 && o.status === 'pending_payment', o);
check(
  'insufficient wallet',
  (await call(`/orders/${o._id}/pay/wallet`, {method: 'POST', token: user})).error?.code === 'INSUFFICIENT_BALANCE',
);
await call('/wallet/topup', {method: 'POST', token: user, body: {amount: 1500}});

// five parallel pays: exactly one debit
const pays = await Promise.all(
  [1, 2, 3, 4, 5].map(() => call(`/orders/${o._id}/pay/wallet`, {method: 'POST', token: user})),
);
check(
  'parallel pays are idempotent',
  pays.every((p) => p.status === 200 && p.data.status === 'paid'),
  pays.map((p) => p.status),
);
let w = (await call('/wallet', {token: user})).data;
check('balance debited once', w.balance === 150000 - 99900, w.balance);

check('customer cannot see staff queue', (await call('/orders/staff/queue', {token: user})).status === 403);
check(
  'other user cannot read order',
  (await call(`/orders/${o._id}`, {token: await login(`x${Date.now()}@example.com`)})).status === 404,
);
check(
  'internal blocked at gateway',
  (await call('/wallet/internal/credit', {method: 'POST', body: {userId: 'x', amount: 1, ref: 'r', note: ''}}))
    .status === 404,
);
check('internal blocked (case)', (await call('/wallet/INTERNAL/credit', {method: 'POST', body: {}})).status === 404);
check('razorpay off', (await call(`/orders/${o._id}/pay/razorpay`, {method: 'POST', token: user})).status === 503);
check(
  'webhook bad signature',
  (
    await call('/orders/payments/razorpay/webhook', {
      method: 'POST',
      body: {event: 'x'},
      headers: {'x-razorpay-signature': 'nope'},
    })
  ).status === 400,
);

check(
  'bad transition',
  (await call(`/orders/staff/${o._id}`, {method: 'PATCH', token: boss, body: {status: 'completed', note: ''}}))
    .status === 409,
);
check(
  'start work',
  (
    await call(`/orders/staff/${o._id}`, {
      method: 'PATCH',
      token: boss,
      body: {status: 'in_progress', note: 'Documents received'},
    })
  ).data?.status === 'in_progress',
);
const done = (
  await call(`/orders/staff/${o._id}`, {method: 'PATCH', token: boss, body: {status: 'completed', note: 'Filed'}})
).data;
check('completed with LGL code', /^LGL-[0-9A-F]{8}$/.test(done?.code ?? ''), done?.code);
const v = await call(`/orders/verify/${done.code.toLowerCase()}`);
check(
  'public verify, no customer data',
  v.data?.serviceName === 'GST Registration' && !JSON.stringify(v).includes('9876500000'),
  v,
);
check('unknown code 404', (await call('/orders/verify/BLK-00000000')).status === 404);

// black order: pay, cancel → refund once
const b = (
  await call('/orders', {
    method: 'POST',
    token: user,
    body: {
      serviceSlug: 'black-gst',
      intake: {phone: '9876500000', practice: 'Business owner', whoFor: 'Just me', timeline: 'As soon as possible'},
    },
  })
).data;
check('black order', b?.amount === 59900, b);
await call('/wallet/topup', {method: 'POST', token: user, body: {amount: 599}});
await call(`/orders/${b._id}/pay/wallet`, {method: 'POST', token: user});
const c = (
  await call(`/orders/staff/${b._id}`, {method: 'PATCH', token: boss, body: {status: 'cancelled', note: 'Duplicate'}})
).data;
check('cancel refunds', c?.payment?.refunded === true, c);
await call(`/orders/staff/${b._id}`, {method: 'PATCH', token: boss, body: {status: 'cancelled', note: ''}});
w = (await call('/wallet', {token: user})).data;
check('refund applied once', w.balance === 150000 - 99900 + 59900, w.balance);
check(
  'customer cancel of paid blocked',
  (await call(`/orders/${o._id}/cancel`, {method: 'POST', token: user})).status === 409,
);
const list = (await call('/orders', {token: user})).data;
check('my orders listed', list.length === 2);
console.log(`${ok} passed, ${bad} failed`);
process.exitCode = bad ? 1 : 0;
