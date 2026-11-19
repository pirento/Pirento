// End-to-end flows (orders, Bharat ID, exam, vault, support) against a running stack (npm run dev with SUPERADMIN_EMAILS=boss@example.com).
// Usage: npm run e2e
import {bankForSlug} from '@pirento/shared/exam';

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

// ── Green: quantity ─────────────────────────────────────────────────────
const g = await call('/orders', {
  method: 'POST',
  token: user,
  body: {
    serviceSlug: 'green-aravalli-ridge',
    quantity: 10,
    intake: {phone: '9876500000', scale: 'A few trees (personal)', whoFor: 'Just me', timeline: 'As soon as possible'},
  },
});
check('green priced per tree', g.data?.amount === 99000 && g.data.quantity === 10, g);
check(
  'quantity capped',
  (await call('/orders', {method: 'POST', token: user, body: {serviceSlug: 'gst-registration', quantity: 2, intake}}))
    .status === 400,
);

// ── Bharat ID ───────────────────────────────────────────────────────────
const kyc = {fullName: 'Asha Verma', dob: '1990-05-01', state: 'Delhi', pan: 'abcde1234f'};
check(
  'minor rejected',
  (await call('/identity/apply', {method: 'POST', token: user, body: {...kyc, dob: '2015-01-01'}})).status === 400,
);
check(
  'bad PAN rejected',
  (await call('/identity/apply', {method: 'POST', token: user, body: {...kyc, pan: 'ABC'}})).status === 400,
);
const app1 = (await call('/identity/apply', {method: 'POST', token: user, body: kyc})).data;
check('applied', app1?.status === 'submitted' && app1.pan === 'ABCDE1234F', app1);
check('no double apply', (await call('/identity/apply', {method: 'POST', token: user, body: kyc})).status === 409);
check(
  'reject needs reason',
  (await call(`/identity/staff/${app1._id}`, {method: 'PATCH', token: boss, body: {decision: 'reject'}})).status ===
    400,
);
const appr = (await call(`/identity/staff/${app1._id}`, {method: 'PATCH', token: boss, body: {decision: 'approve'}}))
  .data;
check('approved with 10-digit ID', /^[1-9]\d{9}$/.test(appr?.bharatId ?? ''), appr);
check(
  'no double approve',
  (await call(`/identity/staff/${app1._id}`, {method: 'PATCH', token: boss, body: {decision: 'approve'}})).status ===
    409,
);
const vid = (await call(`/identity/verify/${appr.bharatId}`)).data;
check('public verify masks name, hides PAN', vid?.name === 'Asha V.' && !JSON.stringify(vid).includes('ABCDE'), vid);
check(
  'bad checksum 400',
  (await call(`/identity/verify/${appr.bharatId.slice(0, 9)}${(Number(appr.bharatId[9]) + 1) % 10}`)).status === 400,
);
check(
  'customer cannot decide',
  (await call(`/identity/staff/${app1._id}`, {method: 'PATCH', token: user, body: {decision: 'approve'}})).status ===
    403,
);

// ── Intern exam ─────────────────────────────────────────────────────────
const ex = (
  await call('/learning/exam/start', {method: 'POST', token: user, body: {track: 'design', fullName: 'Asha Verma'}})
).data;
check('exam has no answers', ex?.questions.length === 10 && ex.questions.every((q) => !('answer' in q)), ex);
const again = (
  await call('/learning/exam/start', {method: 'POST', token: user, body: {track: 'design', fullName: 'Asha Verma'}})
).data;
check('resume same attempt', again?.id === ex.id);
const fail = (await call(`/learning/exam/${ex.id}/submit`, {method: 'POST', token: user, body: {answers: {}}})).data;
check('empty exam fails', fail?.passed === false && fail.percent === 0, fail);
check(
  'only first submit counts',
  (await call(`/learning/exam/${ex.id}/submit`, {method: 'POST', token: user, body: {answers: {}}})).status === 409,
);
check(
  'retry cooldown',
  (await call('/learning/exam/start', {method: 'POST', token: user, body: {track: 'design', fullName: 'A V'}}))
    .status === 429,
);
const ex2 = (
  await call('/learning/exam/start', {
    method: 'POST',
    token: user,
    body: {track: 'web-development', fullName: 'Asha Verma'},
  })
).data;
const key = Object.fromEntries(bankForSlug('web-development').map((q) => [q.id, q.answer]));
const pass = (await call(`/learning/exam/${ex2.id}/submit`, {method: 'POST', token: user, body: {answers: key}})).data;
check(
  'perfect exam passes with certificate',
  pass?.passed && /^PC-[0-9A-F]{8}$/.test(pass.certificate?.code ?? ''),
  pass,
);
const cv = (await call(`/learning/verify/${pass.certificate.code}`)).data;
check('certificate verifies publicly', cv?.fullName === 'Asha Verma' && cv.percent === 100 && !('userId' in cv), cv);
check(
  'no second certificate',
  (
    await call('/learning/exam/start', {
      method: 'POST',
      token: user,
      body: {track: 'web-development', fullName: 'Asha V'},
    })
  ).status === 409,
);
check('fake cert 404', (await call('/learning/verify/PC-00000000')).status === 404);

// ── Vault ───────────────────────────────────────────────────────────────
const up = await fetch(B + '/vault/files', {
  method: 'POST',
  headers: {
    authorization: `Bearer ${user}`,
    'content-type': 'application/octet-stream',
    'x-file-name': encodeURIComponent('नोट.json'),
    'x-file-type': 'application/json',
  },
  body: '{"secret":"hello"}',
});
const file = (await up.json()).data;
check('upload', up.status === 201 && file.size === 18, file);
const dl = await fetch(B + `/vault/files/${file._id}`, {headers: {authorization: `Bearer ${user}`}});
check(
  'download decrypts',
  (await dl.text()) === '{"secret":"hello"}' && /attachment/.test(dl.headers.get('content-disposition')),
);
check(
  'other user cannot download',
  (await fetch(B + `/vault/files/${file._id}`, {headers: {authorization: `Bearer ${boss}`}})).status === 404,
);
const cred = (
  await call('/vault/credentials', {
    method: 'POST',
    token: user,
    body: {label: 'Bank', username: 'asha', password: 'p@ss'},
  })
).data;
const list2 = (await call('/vault/credentials', {token: user})).data;
check('password not in list', list2.length === 1 && !JSON.stringify(list2).includes('p@ss'));
check(
  'reveal password',
  (await call(`/vault/credentials/${cred._id}/secret`, {token: user})).data?.password === 'p@ss',
);
check('delete file', (await call(`/vault/files/${file._id}`, {method: 'DELETE', token: user})).data?.deleted);

// ── Support ─────────────────────────────────────────────────────────────
const t = (
  await call('/support', {
    method: 'POST',
    token: user,
    body: {subject: 'Where is my GST?', message: 'Any update please'},
  })
).data;
check('ticket number', t?.ticketNo > 10_000_000 && t.status === 'open', t);
check(
  'other user cannot read ticket',
  (await call(`/support/${t._id}`, {token: await login(`y${Date.now()}@example.com`)})).status === 404,
);
const ans = (await call(`/support/${t._id}/messages`, {method: 'POST', token: boss, body: {body: 'Filed today.'}}))
  .data;
check('staff reply → answered', ans?.status === 'answered' && ans.messages.at(-1).from === 'staff', ans);
const back = (await call(`/support/${t._id}/messages`, {method: 'POST', token: user, body: {body: 'Thanks!'}})).data;
check('customer reply → open', back?.status === 'open');
check('close', (await call(`/support/${t._id}/close`, {method: 'POST', token: user})).data?.status === 'closed');

// ── Sessions: refresh rotation, logout ──────────────────────────────────
async function loginWithCookie(email) {
  const {data} = await call('/auth/otp/request', {method: 'POST', body: {email}});
  const r = await fetch(B + '/auth/otp/verify', {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({email, code: data.devCode}),
  });
  const cookie = r.headers.get('set-cookie')?.split(';')[0];
  return {token: (await r.json()).data.token, cookie};
}
const sess = await loginWithCookie(`s${Date.now()}@example.com`);
check('refresh cookie is httpOnly', /^pirento_rt=/.test(sess.cookie ?? ''));
const r1 = await fetch(B + '/auth/refresh', {method: 'POST', headers: {cookie: sess.cookie}});
const next = r1.headers.get('set-cookie')?.split(';')[0];
check('refresh issues a new token', r1.status === 200 && next && next !== sess.cookie);
check(
  'old refresh token is single-use',
  (await fetch(B + '/auth/refresh', {method: 'POST', headers: {cookie: sess.cookie}})).status === 401,
);
await fetch(B + '/auth/logout', {method: 'POST', headers: {cookie: next}});
check('logout revokes', (await fetch(B + '/auth/refresh', {method: 'POST', headers: {cookie: next}})).status === 401);

// ── Admin: roles ────────────────────────────────────────────────────────
const staffer = await loginWithCookie(`staff${Date.now()}@example.com`);
check('customer cannot list users', (await call('/auth/admin/users', {token: user})).status === 403);
const found = (await call(`/auth/admin/users?q=${encodeURIComponent('staff')}`, {token: boss})).data;
const target = found.users.find((u) => u.email.startsWith('staff'));
check('admin can search users', found.total > 0 && target);
const bossId = (await call('/auth/admin/users?q=boss%40example.com', {token: boss})).data.users[0]._id;
check(
  'cannot change own role',
  (await call(`/auth/admin/users/${bossId}/role`, {method: 'PATCH', token: boss, body: {role: 'customer'}})).status ===
    400,
);
const promoted = (
  await call(`/auth/admin/users/${target._id}/role`, {method: 'PATCH', token: boss, body: {role: 'staff'}})
).data;
check('promote to staff', promoted?.role === 'staff');
check(
  'role change ends sessions',
  (await fetch(B + '/auth/refresh', {method: 'POST', headers: {cookie: staffer.cookie}})).status === 401,
);
const staffToken = (await loginWithCookie(target.email)).token;
check('new staff sees the queue', (await call('/orders/staff/queue', {token: staffToken})).status === 200);
const stats = (await call('/orders/staff/stats', {token: boss})).data;
check('order stats', stats?.revenue > 0 && stats.byStatus.completed >= 1, stats);

// ── Pirento One + Giftox ────────────────────────────────────────────────
const partner = (await call('/orders/partner/join', {method: 'POST', token: staffToken})).data;
check('partner code', /^P[0-9A-F]{6}$/.test(partner?.code ?? ''), partner);
check(
  'join is idempotent',
  (await call('/orders/partner/join', {method: 'POST', token: staffToken})).data?.code === partner.code,
);
const gift = {
  phone: '9876500000',
  recipientName: 'Ravi',
  address: '12 MG Road, Pune',
  pincode: '411001',
  occasion: 'Personal celebration',
  whoFor: 'A gift for someone',
  timeline: 'As soon as possible',
};
check(
  'gift needs an address',
  (
    await call('/orders', {
      method: 'POST',
      token: user,
      body: {serviceSlug: 'giftox-diwali-collection', intake: {...gift, address: ''}},
    })
  ).status === 400,
);
const go = (
  await call('/orders', {
    method: 'POST',
    token: user,
    body: {serviceSlug: 'giftox-diwali-collection', quantity: 2, ref: partner.code.toLowerCase(), intake: gift},
  })
).data;
check('gift order with referral', go?.amount === 399800 && go.ref === partner.code, go);
const own = (
  await call('/orders', {
    method: 'POST',
    token: staffToken,
    body: {serviceSlug: 'giftox-welcome-kit', ref: partner.code, intake: gift},
  })
).data;
check('own code is ignored', own && !own.ref);
const pm = (await call('/orders/partner/me', {token: staffToken})).data;
check(
  'partner sees referred order without customer data',
  pm?.orders.length === 1 && !JSON.stringify(pm).includes('9876500000') && !JSON.stringify(pm).includes('@'),
  pm,
);

// ── AI ──────────────────────────────────────────────────────────────────
const ai = (await call('/ai/status', {token: user})).data;
if (ai?.enabled) console.log('note: ANTHROPIC_API_KEY is set; skipping the AI-off check');
else
  check(
    'AI off without a key',
    (await call('/ai/chats/new/messages', {method: 'POST', token: user, body: {content: 'hi'}})).status === 503,
  );
check('AI needs sign-in', (await call('/ai/status')).status === 401);

console.log(`${ok} passed, ${bad} failed`);
process.exitCode = bad ? 1 : 0;
