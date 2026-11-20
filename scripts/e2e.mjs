// End-to-end flows against a running stack: npm run dev with SUPERADMIN_EMAILS=boss@example.com SUPERADMIN_STAFF_ID=root.admin SUPERADMIN_PASSWORD=change-me-now-123 OTP_RESEND_SECONDS=0.
// Usage: npm run e2e
import {bankForSlug} from '@pirento/shared/exam';
import {verhoeffCheckDigit} from '@pirento/shared';

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
  // acceptTerms: a first email sign-in creates the account, which needs the terms accepted.
  return (await call('/auth/otp/verify', {method: 'POST', body: {email, code: data.devCode, acceptTerms: true}})).data
    .token;
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
const aadhaarNo = '23456789012' + verhoeffCheckDigit('23456789012');
const steps = {
  contact: {mobile: '9876500000'},
  personal: {fullName: 'Asha Verma', fatherName: 'Ravi Verma', dob: '1990-05-01', gender: 'Female'},
  documents: {pan: 'abcde1234f', aadhaar: aadhaarNo},
  address: {line: '12 MG Road', city: 'Delhi', state: 'Delhi', pincode: '110001'},
  work: {occupation: 'Salaried', income: '₹5–10 lakh'},
  bank: {bankName: 'SBI', account: '123456789012', ifsc: 'SBIN0001234'},
  nominee: {
    nomineeName: 'Ravi Verma',
    nomineeRelation: 'Father',
    nomineeMobile: '9876500001',
    emergencyName: 'Meena Verma',
    emergencyMobile: '9876500002',
  },
};
const put = (section, body, token = user) => call(`/identity/draft/${section}`, {method: 'PUT', token, body});
check('minor rejected', (await put('personal', {...steps.personal, dob: '2015-01-01'})).status === 400);
check('bad PAN rejected', (await put('documents', {...steps.documents, pan: 'ABC'})).status === 400);
check(
  'bad Aadhaar checksum rejected',
  (await put('documents', {...steps.documents, aadhaar: aadhaarNo.slice(0, 11) + ((Number(aadhaarNo[11]) + 1) % 10)}))
    .status === 400,
);
for (const [k, v] of Object.entries(steps).slice(0, 6)) await put(k, v);
check(
  'submit blocked until every step is done',
  (await call('/identity/submit', {method: 'POST', token: user, body: {consent: true}})).error?.code === 'INCOMPLETE',
);
const draft = (await put('nominee', steps.nominee)).data;
check(
  'only last 4 of Aadhaar and account stored',
  draft?.sections.documents.aadhaar === `XXXX XXXX ${aadhaarNo.slice(-4)}` &&
    draft.sections.bank.account === '••••9012' &&
    !JSON.stringify(draft).includes(aadhaarNo),
  draft,
);
check(
  'consent required',
  (await call('/identity/submit', {method: 'POST', token: user, body: {consent: false}})).status === 400,
);
check(
  'video KYC required before submit',
  /video/i.test(
    (await call('/identity/submit', {method: 'POST', token: user, body: {consent: true}})).error?.message ?? '',
  ),
);
const challenge = (await call('/identity/kyc/challenge', {method: 'POST', token: user})).data;
check('4-digit KYC challenge', /^\d{4}$/.test(challenge?.challenge ?? ''), challenge);
check(
  'same challenge on reload',
  (await call('/identity/kyc/challenge', {method: 'POST', token: user})).data?.challenge === challenge.challenge,
);
const fakeVideo = Buffer.alloc(4096, 7); // the service stores bytes; it does not decode video
const upload = await fetch(B + '/identity/kyc/video', {
  method: 'POST',
  headers: {authorization: `Bearer ${user}`, 'content-type': 'video/webm'},
  body: fakeVideo,
});
check('KYC video uploaded', upload.status === 201 && (await upload.json()).data?.kyc?.size === 4096);
const app1 = (await call('/identity/submit', {method: 'POST', token: user, body: {consent: true}})).data;
check('submitted', app1?.status === 'submitted' && app1.fullName === 'Asha Verma', app1);
check('locked after submit', (await put('contact', steps.contact)).status === 409);
check(
  'reject needs reason',
  (await call(`/identity/staff/${app1._id}`, {method: 'PATCH', token: boss, body: {decision: 'reject'}})).status ===
    400,
);
const rej = (
  await call(`/identity/staff/${app1._id}`, {
    method: 'PATCH',
    token: boss,
    body: {decision: 'reject', reason: 'Name does not match PAN'},
  })
).data;
check('rejected with reason', rej?.status === 'rejected' && rej.reason === 'Name does not match PAN');
check(
  'editable after rejection',
  (await put('personal', {...steps.personal, fullName: 'Asha Rani Verma'})).status === 200,
);
const again2 = (await call('/identity/submit', {method: 'POST', token: user, body: {consent: true}})).data;
check(
  'resubmitted, reason cleared',
  again2?.status === 'submitted' && !again2.reason && again2.fullName === 'Asha Rani Verma',
  again2,
);
const played = await fetch(B + `/identity/staff/${app1._id}/video`, {headers: {authorization: `Bearer ${boss}`}});
check(
  'staff can play the KYC video',
  played.status === 200 && Buffer.from(await played.arrayBuffer()).equals(fakeVideo),
);
check(
  'customer cannot play KYC videos',
  (await fetch(B + `/identity/staff/${app1._id}/video`, {headers: {authorization: `Bearer ${user}`}})).status === 403,
);
const appr = (await call(`/identity/staff/${app1._id}`, {method: 'PATCH', token: boss, body: {decision: 'approve'}}))
  .data;
check('approved with 10-digit ID', /^[1-9]\d{9}$/.test(appr?.bharatId ?? ''), appr);
check(
  'KYC video deleted once approved',
  (await fetch(B + `/identity/staff/${app1._id}/video`, {headers: {authorization: `Bearer ${boss}`}})).status === 404,
);
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
    body: JSON.stringify({email, code: data.devCode, acceptTerms: true}),
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

// ── Admin: staff roles, panels, suspension, audit trail ─────────────────
const sup = await loginWithCookie(`support${Date.now()}@example.com`);
const supUser = (await call(`/auth/admin/users?q=${encodeURIComponent('support')}`, {token: boss})).data.users[0];
await call(`/auth/admin/users/${supUser._id}/role`, {method: 'PATCH', token: boss, body: {role: 'support'}});
const supToken = (await loginWithCookie(supUser.email)).token;
check('support sees tickets', (await call('/support/staff/queue', {token: supToken})).status === 200);
check('support cannot see orders', (await call('/orders/staff/queue', {token: supToken})).status === 403);
check('support cannot see the ledger', (await call('/wallet/staff/transactions', {token: supToken})).status === 403);
check('support can look up users', (await call('/auth/admin/users', {token: supToken})).status === 200);
check(
  'support cannot change roles',
  (await call(`/auth/admin/users/${target._id}/role`, {method: 'PATCH', token: supToken, body: {role: 'customer'}}))
    .status === 403,
);
check('staff cannot read the audit trail', (await call('/auth/admin/audit', {token: staffToken})).status === 403);
const signups = (await call('/auth/admin/stats', {token: boss})).data;
check('signups per day', signups?.total > 0 && signups.signups.at(-1)?.count > 0, signups);
const daily = (await call('/orders/staff/daily', {token: boss})).data;
check('orders per day', daily?.at(-1)?.count > 0, daily);
const ledger = (await call('/wallet/staff/transactions', {token: boss})).data;
check('ledger across accounts', ledger?.transactions.length > 0 && ledger.held >= 0, ledger);
const someone = ledger.transactions[0].userId;
check('one wallet', typeof (await call(`/wallet/staff/user/${someone}`, {token: supToken})).data?.balance === 'number');
check('one person orders', Array.isArray((await call(`/orders/staff/user/${someone}`, {token: boss})).data));
check('certificates list', Array.isArray((await call('/learning/staff/certificates', {token: boss})).data));
check('identity per user', (await call(`/identity/staff/user/${someone}`, {token: boss})).status === 200);
const susp = (
  await call(`/auth/admin/users/${supUser._id}/suspend`, {method: 'PATCH', token: boss, body: {suspended: true}})
).data;
check('suspend', susp?.suspended === true);
check(
  'suspended cannot refresh',
  (await fetch(B + '/auth/refresh', {method: 'POST', headers: {cookie: sup.cookie}})).status === 401,
);
{
  const {data} = await call('/auth/otp/request', {method: 'POST', body: {email: supUser.email}});
  const r = await call('/auth/otp/verify', {method: 'POST', body: {email: supUser.email, code: data.devCode}});
  check('suspended cannot sign in', r.status === 403 && r.error?.code === 'SUSPENDED', r);
}
await call(`/auth/admin/users/${supUser._id}/suspend`, {method: 'PATCH', token: boss, body: {suspended: false}});
check('restored can sign in', Boolean((await loginWithCookie(supUser.email)).token));
const trail = (await call('/auth/admin/audit', {token: boss})).data ?? [];
const actions = new Set(trail.map((r) => r.action));
check(
  'audit trail records staff actions',
  ['role.change', 'account.suspend', 'account.restore', 'order.completed', 'bharat-id.approve', 'ticket.reply'].every(
    (a) => actions.has(a),
  ),
  [...actions],
);

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

// ── Admin: coupons ──────────────────────────────────────────────────────
const code = `E2E${Date.now().toString().slice(-6)}`;
check(
  'support cannot make codes',
  (await call('/orders/staff/coupons', {method: 'POST', token: supToken, body: {code, kind: 'percent', value: 10}}))
    .status === 403,
);
const cp = (
  await call('/orders/staff/coupons', {
    method: 'POST',
    token: boss,
    body: {code, kind: 'percent', value: 10, product: 'giftox', maxUses: 1},
  })
).data;
check('create code', cp?.code === code, cp);
check(
  'code preview',
  (await call(`/orders/coupons/${code.toLowerCase()}?service=giftox-welcome-kit`, {token: user})).data?.discount ===
    14990,
);
check(
  'code refuses other products',
  (await call(`/orders/coupons/${code}?service=gst-registration`, {token: user})).error?.code === 'COUPON',
);
const disc = (
  await call('/orders', {
    method: 'POST',
    token: user,
    body: {serviceSlug: 'giftox-welcome-kit', coupon: code, intake: gift},
  })
).data;
check('order with code is priced by the server', disc?.amount === 134910 && disc.discount === 14990, disc);
check(
  'a one-use code works once',
  (
    await call('/orders', {
      method: 'POST',
      token: user,
      body: {serviceSlug: 'giftox-welcome-kit', coupon: code, intake: gift},
    })
  ).error?.code === 'COUPON',
);
await call(`/orders/staff/coupons/${cp._id}`, {method: 'PATCH', token: boss, body: {active: false}});
check('code redemptions', (await call(`/orders/staff/coupons/${cp._id}/orders`, {token: boss})).data?.length === 1);

// ── Admin: order assign, note, product scope ────────────────────────────
const me2 = (await call('/auth/me', {token: staffToken})).data;
check(
  'staff cannot assign to someone else',
  (
    await call(`/orders/staff/${disc._id}/assign`, {
      method: 'PATCH',
      token: staffToken,
      body: {assignee: {id: bossId, email: 'boss@example.com'}},
    })
  ).status === 409,
);
const took = (
  await call(`/orders/staff/${disc._id}/assign`, {
    method: 'PATCH',
    token: staffToken,
    body: {assignee: {id: me2._id, email: me2.email}},
  })
).data;
check('take an order', took?.assignee?.id === me2._id);
const noted = (
  await call(`/orders/staff/${disc._id}/message`, {method: 'POST', token: staffToken, body: {note: 'Box packed'}})
).data;
check('note without status change', noted?.status === 'pending_payment' && noted.timeline.at(-1).note === 'Box packed');
check(
  'customer sees the note',
  (await call(`/orders/${disc._id}`, {token: user})).data?.timeline.at(-1).note === 'Box packed',
);
check(
  'team list',
  (await call('/auth/admin/team', {token: staffToken})).data?.some((m) => m._id === me2._id),
);
check('workload', typeof (await call('/orders/staff/workload', {token: boss})).data?.unassigned === 'number');
await call(`/auth/admin/users/${me2._id}/products`, {method: 'PATCH', token: boss, body: {products: ['legal']}});
const scopedToken = (await loginWithCookie(me2.email)).token;
check(
  'scoped staff do not see other products',
  (await call(`/orders/${disc._id}`, {token: scopedToken})).status === 404,
);
check(
  'scoped queue only has their products',
  ((await call('/orders/staff/queue?status=pending_payment', {token: scopedToken})).data ?? [1]).every(
    (o) => o.product === 'legal',
  ),
);
await call(`/auth/admin/users/${me2._id}/products`, {method: 'PATCH', token: boss, body: {products: []}});

// ── Admin: tickets ──────────────────────────────────────────────────────
const tk = (
  await call('/support', {method: 'POST', token: user, body: {subject: 'Capital waitlist', message: 'A shop loan'}})
).data;
const supAgain = (await loginWithCookie(supUser.email)).token;
const supMe = (await call('/auth/me', {token: supAgain})).data;
const withNote = (
  await call(`/support/${tk._id}/notes`, {method: 'POST', token: boss, body: {body: 'Call back Monday'}})
).data;
check('team note', withNote?.notes?.at(-1)?.body === 'Call back Monday');
check('customer never sees notes', (await call(`/support/${tk._id}`, {token: user})).data?.notes === undefined);
check(
  'customer cannot add notes',
  (await call(`/support/${tk._id}/notes`, {method: 'POST', token: user, body: {body: 'hi there'}})).status === 404,
);
const tAssigned = (
  await call(`/support/${tk._id}/assign`, {
    method: 'PATCH',
    token: supAgain,
    body: {assignee: {id: supMe._id, email: supMe.email}},
  })
).data;
check('take a ticket', tAssigned?.assignee?.email === supMe.email);
check(
  'mine filter',
  (await call('/support/staff/queue?mine=1&status=open', {token: supAgain})).data?.some((t) => t._id === tk._id),
);
check(
  'capital waitlist',
  (await call(`/support/staff/subject?q=${encodeURIComponent('Capital waitlist')}`, {token: boss})).data?.some(
    (t) => t._id === tk._id,
  ),
);

// ── Admin: wallet adjust and withdrawals ────────────────────────────────
const userMe = (await call('/auth/me', {token: user})).data;
check(
  'support cannot adjust',
  (
    await call('/wallet/staff/adjust', {
      method: 'POST',
      token: supAgain,
      body: {userId: userMe._id, type: 'credit', amount: 5, reason: 'test'},
    })
  ).status === 403,
);
const before = (await call('/wallet', {token: user})).data.balance;
await call('/wallet/staff/adjust', {
  method: 'POST',
  token: boss,
  body: {userId: userMe._id, type: 'credit', amount: 250, reason: 'Goodwill'},
});
check('adjust credits', (await call('/wallet', {token: user})).data.balance === before + 25000);
check(
  'withdrawal needs a UPI ID',
  (await call('/wallet/withdrawals', {method: 'POST', token: user, body: {amount: 100, upi: 'nope'}})).status === 400,
);
const wd = (await call('/wallet/withdrawals', {method: 'POST', token: user, body: {amount: 150, upi: 'test@upi'}}))
  .data;
check(
  'withdrawal holds the money',
  wd?.status === 'requested' && (await call('/wallet', {token: user})).data.balance === before + 10000,
);
check(
  'one open withdrawal at a time',
  (await call('/wallet/withdrawals', {method: 'POST', token: user, body: {amount: 100, upi: 'test@upi'}})).status ===
    409,
);
check(
  'rejecting needs a reason',
  (await call(`/wallet/staff/withdrawals/${wd._id}`, {method: 'PATCH', token: boss, body: {decision: 'rejected'}}))
    .status === 400,
);
await call(`/wallet/staff/withdrawals/${wd._id}`, {
  method: 'PATCH',
  token: boss,
  body: {decision: 'rejected', reason: 'UPI ID inactive'},
});
check('rejected withdrawal comes back', (await call('/wallet', {token: user})).data.balance === before + 25000);
check(
  'decided once',
  (
    await call(`/wallet/staff/withdrawals/${wd._id}`, {
      method: 'PATCH',
      token: boss,
      body: {decision: 'paid', utr: 'X1'},
    })
  ).status === 409,
);
const wd2 = (await call('/wallet/withdrawals', {method: 'POST', token: user, body: {amount: 100, upi: 'test@upi'}}))
  .data;
const paid = (
  await call(`/wallet/staff/withdrawals/${wd2._id}`, {
    method: 'PATCH',
    token: boss,
    body: {decision: 'paid', utr: 'UTR123'},
  })
).data;
check('paid withdrawal', paid?.status === 'paid' && paid.utr === 'UTR123');

// ── Admin: settings ─────────────────────────────────────────────────────
check(
  'banner link must be on-site',
  (
    await call('/catalog/staff/settings', {
      method: 'PATCH',
      token: boss,
      body: {banner: {on: true, text: 'Hi', link: 'https://evil.example'}, paused: []},
    })
  ).status === 400,
);
check(
  'staff cannot change settings',
  (
    await call('/catalog/staff/settings', {
      method: 'PATCH',
      token: staffToken,
      body: {banner: {on: false, text: '', link: ''}, paused: []},
    })
  ).status === 403,
);
await call('/catalog/staff/settings', {
  method: 'PATCH',
  token: boss,
  body: {banner: {on: true, text: 'Diwali boxes are here', link: '/giftox'}, paused: ['giftox']},
});
check('banner is public', (await call('/catalog/settings')).data?.banner.text === 'Diwali boxes are here');
check(
  'paused product takes no orders',
  (await call('/orders', {method: 'POST', token: user, body: {serviceSlug: 'giftox-welcome-kit', intake: gift}})).error
    ?.code === 'PAUSED',
);
await call('/catalog/staff/settings', {
  method: 'PATCH',
  token: boss,
  body: {banner: {on: false, text: '', link: ''}, paused: []},
});

// ── Admin: openings ─────────────────────────────────────────────────────
const op = (
  await call('/learning/staff/openings', {
    method: 'POST',
    token: boss,
    body: {
      title: 'Design intern',
      kind: 'internship',
      mode: 'remote',
      description: 'Help design the Pirento sites for three months.',
    },
  })
).data;
check('post opening', Boolean(op?._id), op);
check(
  'openings are public',
  (await call('/learning/openings')).data?.some((o) => o._id === op._id),
);
check(
  'apply',
  (await call(`/learning/openings/${op._id}/apply`, {method: 'POST', token: user, body: {note: 'I design'}})).status ===
    201,
);
check(
  'apply once',
  (await call(`/learning/openings/${op._id}/apply`, {method: 'POST', token: user, body: {}})).status === 409,
);
const apps = (await call(`/learning/staff/openings/${op._id}/applications`, {token: boss})).data;
await call(`/learning/staff/openings/applications/${apps[0]._id}`, {
  method: 'PATCH',
  token: boss,
  body: {status: 'shortlisted'},
});
check(
  'applicant sees status',
  (await call('/learning/openings/mine', {token: user})).data?.[0]?.status === 'shortlisted',
);
await call(`/learning/staff/openings/${op._id}`, {method: 'PATCH', token: boss, body: {open: false}});
check('closed opening hidden', !(await call('/learning/openings')).data?.some((o) => o._id === op._id));

// ── Admin: prices, coupon given back ────────────────────────────────────
check(
  'staff cannot change prices',
  (await call('/catalog/staff/prices/gst-registration', {method: 'PATCH', token: staffToken, body: {price: 1}}))
    .status === 403,
);
await call('/catalog/staff/prices/gst-registration', {method: 'PATCH', token: boss, body: {price: 1199}});
check('new price is public', (await call('/catalog/prices')).data?.['gst-registration']?.price === 1199);
const repriced = (await call('/orders', {method: 'POST', token: user, body: {serviceSlug: 'gst-registration', intake}}))
  .data;
check('orders charge the new price', repriced?.amount === 119900, repriced);
await call('/catalog/staff/prices/gst-registration', {
  method: 'PATCH',
  token: boss,
  body: {price: null, offSale: true},
});
check(
  'off-sale service takes no orders',
  (await call('/orders', {method: 'POST', token: user, body: {serviceSlug: 'gst-registration', intake}})).error
    ?.code === 'NOT_FOR_SALE',
);
await call('/catalog/staff/prices/gst-registration', {method: 'PATCH', token: boss, body: {price: null}});
check('reset removes the override', !(await call('/catalog/prices')).data?.['gst-registration']);
check('service page shows the live price', (await call('/catalog/services/gst-registration')).data?.price === 999);
const code2 = `BACK${Date.now().toString().slice(-6)}`;
const cp2 = (
  await call('/orders/staff/coupons', {
    method: 'POST',
    token: boss,
    body: {code: code2, kind: 'flat', value: 100, maxUses: 1},
  })
).data;
const o2 = (
  await call('/orders', {method: 'POST', token: user, body: {serviceSlug: 'gst-registration', coupon: code2, intake}})
).data;
await call(`/orders/${o2._id}/cancel`, {method: 'POST', token: user});
check(
  'unpaid cancel gives the code back',
  (await call('/orders/staff/coupons', {token: boss})).data?.find((c) => c._id === cp2._id)?.uses === 0,
);

// ── Sign-in methods: Bharat ID, staff door, providers ───────────────────
const providers = (await call('/auth/providers')).data;
// Mobile is on outside production (codes show on screen) and in production only with SMS_WEBHOOK_URL.
check(
  'providers',
  providers?.email && providers.bharatId && providers.password && typeof providers.mobile === 'boolean',
  providers,
);
check(
  'Google off without a client id',
  (await call('/auth/google', {method: 'POST', body: {idToken: 'x'.repeat(30)}})).status === 404,
);
const userMe2 = (await call('/auth/me', {token: user})).data;
// One digit off: the check digit catches it before any lookup.
const typo = appr.bharatId.slice(0, 9) + ((Number(appr.bharatId[9]) + 1) % 10);
check(
  'Bharat ID with a typo is refused',
  (await call('/auth/otp/bharat-id/request', {method: 'POST', body: {bharatId: typo}})).status === 400,
);
const bidReq = (await call('/auth/otp/bharat-id/request', {method: 'POST', body: {bharatId: appr.bharatId}})).data;
check(
  'Bharat ID code goes to a masked email',
  bidReq?.sent && /•••@/.test(bidReq.sentTo) && !bidReq.sentTo.includes(userMe2.email),
  bidReq,
);
const bidLogin = (
  await call('/auth/otp/bharat-id/verify', {method: 'POST', body: {bharatId: appr.bharatId, code: bidReq.devCode}})
).data;
check('Bharat ID signs in the holder', bidLogin?.user?._id === userMe2._id, bidLogin);
check(
  'an unissued Bharat ID is refused',
  (await call('/auth/otp/bharat-id/request', {method: 'POST', body: {bharatId: '1000000001'}})).error?.code !==
    undefined,
);

const root = (
  await call('/auth/staff/login', {method: 'POST', body: {staffId: 'root.admin', password: 'change-me-now-123'}})
).data;
check('seeded superadmin signs in with staff ID', root?.user?.role === 'superadmin', root);
const sid = `ops${Date.now().toString().slice(-6)}`;
const made = await call('/auth/admin/staff', {
  method: 'POST',
  token: root.token,
  body: {staffId: sid, email: `${sid}@example.com`, role: 'staff', password: 'first-pass-123'},
});
check(
  'superadmin issues a staff ID',
  made.status === 201 && made.data.staffId === sid && !('passwordHash' in made.data),
  made,
);
// Operations staff see their own work and unassigned work, never someone else's.
const other = (await call('/auth/staff/login', {method: 'POST', body: {staffId: sid, password: 'first-pass-123'}})).data
  .token;
check(
  "staff cannot pay or cancel a customer's order",
  (await call(`/orders/${disc._id}/pay/wallet`, {method: 'POST', token: root.token})).status === 404 &&
    (await call(`/orders/${disc._id}/cancel`, {method: 'POST', token: root.token})).status === 404,
);
check(
  'other staff cannot open an order taken by someone else',
  (await call(`/orders/${disc._id}`, {token: other})).status === 404,
);
check(
  "other staff's queue leaves it out",
  !(await call('/orders/staff/queue?status=pending_payment', {token: other})).data?.some((o) => o._id === disc._id),
);
check('a superadmin still sees it', (await call(`/orders/${disc._id}`, {token: root.token})).status === 200);
check('operations staff see no money totals', (await call('/orders/staff/stats', {token: other})).status === 403);
check('operations staff see no workload', (await call('/orders/staff/workload', {token: other})).status === 403);
check(
  'staff cannot issue staff IDs',
  (
    await call('/auth/admin/staff', {
      method: 'POST',
      token: staffToken,
      body: {staffId: 'x1y2z3', email: 'x@example.com', role: 'staff', password: 'abcdefghijk'},
    })
  ).status === 403,
);
const wrong = await call('/auth/staff/login', {method: 'POST', body: {staffId: sid, password: 'not-the-password'}});
check('wrong password', wrong.status === 401 && wrong.error.message === 'Wrong staff ID or password');
const unknown = await call('/auth/staff/login', {
  method: 'POST',
  body: {staffId: 'nobody.here', password: 'whatever-123'},
});
check('unknown staff ID answers the same', unknown.status === 401 && unknown.error.message === wrong.error.message);
check(
  'a wrong try slows the next',
  (await call('/auth/staff/login', {method: 'POST', body: {staffId: sid, password: 'first-pass-123'}})).status === 429,
);
await new Promise((r) => setTimeout(r, 1100));
const opsLogin = (await call('/auth/staff/login', {method: 'POST', body: {staffId: sid, password: 'first-pass-123'}}))
  .data;
check('new staff signs in', opsLogin?.user?.role === 'staff');
check(
  'change own password needs the current one',
  (
    await call('/auth/me/password', {
      method: 'PATCH',
      token: opsLogin.token,
      body: {current: 'nope', next: 'second-pass-123'},
    })
  ).status === 400,
);
await call('/auth/me/password', {
  method: 'PATCH',
  token: opsLogin.token,
  body: {current: 'first-pass-123', next: 'second-pass-123'},
});
check(
  'changed password works',
  Boolean(
    (await call('/auth/staff/login', {method: 'POST', body: {staffId: sid, password: 'second-pass-123'}})).data?.token,
  ),
);
await call(`/auth/admin/users/${made.data._id}/password`, {
  method: 'PATCH',
  token: root.token,
  body: {password: 'reset-pass-123'},
});
check(
  'superadmin reset works',
  Boolean(
    (await call('/auth/staff/login', {method: 'POST', body: {staffId: sid, password: 'reset-pass-123'}})).data?.token,
  ),
);
await call(`/auth/admin/users/${made.data._id}/role`, {method: 'PATCH', token: root.token, body: {role: 'customer'}});
check(
  'a right password without a staff role is refused like a wrong one',
  (await call('/auth/staff/login', {method: 'POST', body: {staffId: sid, password: 'reset-pass-123'}})).error
    ?.message === 'Wrong staff ID or password',
);
check(
  'failed staff sign-ins are audited',
  ((await call('/auth/admin/audit?action=auth.staff_login_failed', {token: boss})).data ?? []).some(
    (r) => r.target === sid,
  ),
);

// ── Accounts: sign-up, user ID + password, mobile, forgot password / user ID ──
{
  const stranger = `nobody${Date.now()}@example.com`;
  const sc = (await call('/auth/otp/request', {method: 'POST', body: {email: stranger}})).data;
  const no = await call('/auth/otp/verify', {method: 'POST', body: {email: stranger, code: sc.devCode}});
  check(
    'email code does not create an account without the terms',
    no.status === 404 && no.error.code === 'NO_ACCOUNT',
    no,
  );

  const n = Date.now().toString().slice(-8);
  const mobile = `9${n.padStart(9, '0')}`;
  const regEmail = `reg${n}@example.com`;
  check(
    'sign-up refuses a bad mobile',
    (await call('/auth/register/start', {method: 'POST', body: {name: 'Asha', email: regEmail, phone: '12345'}}))
      .status === 400,
  );
  const start = (
    await call('/auth/register/start', {method: 'POST', body: {name: 'Asha Verma', email: regEmail, phone: mobile}})
  ).data;
  check(
    'sign-up sends both codes',
    start?.devCodes?.email && start.devCodes.phone && /•••/.test(start.sentTo.phone),
    start,
  );
  const badCodes = await call('/auth/register/verify', {
    method: 'POST',
    body: {name: 'Asha Verma', email: regEmail, phone: mobile, emailCode: start.devCodes.email, phoneCode: '000000'},
  });
  check('sign-up needs the right mobile code', badCodes.status === 400);
  const again = (
    await call('/auth/register/start', {method: 'POST', body: {name: 'Asha Verma', email: regEmail, phone: mobile}})
  ).data;
  const {ticket} =
    (
      await call('/auth/register/verify', {
        method: 'POST',
        body: {
          name: 'Asha Verma',
          email: regEmail,
          phone: mobile,
          emailCode: again.devCodes.email,
          phoneCode: again.devCodes.phone,
        },
      })
    ).data ?? {};
  check('both codes give a ticket', Boolean(ticket));
  const uname = `asha${n}`;
  check('user ID is free', (await call(`/auth/register/username/${uname}`)).data?.free === true);
  check(
    'terms must be accepted',
    (await call('/auth/register', {method: 'POST', body: {ticket, username: uname, password: 'goodpass123'}}))
      .status === 400,
  );
  check(
    'weak password refused',
    (
      await call('/auth/register', {
        method: 'POST',
        body: {ticket, username: uname, password: 'short', acceptTerms: true},
      })
    ).status === 400,
  );
  const made = (
    await call('/auth/register', {
      method: 'POST',
      body: {ticket, username: uname, password: 'goodpass123', acceptTerms: true},
    })
  ).data;
  check(
    'account created and signed in',
    made?.user?.username === uname && made.user.phone === `+91${mobile}` && made.user.termsVersion,
    made,
  );
  check('no password hash goes out', !JSON.stringify(made).includes('scrypt'));
  check(
    'email taken now',
    (await call('/auth/register/start', {method: 'POST', body: {name: 'X Y', email: regEmail, phone: '9123456789'}}))
      .error?.code === 'EMAIL_TAKEN',
  );

  const byId = (await call('/auth/password/login', {method: 'POST', body: {login: uname, password: 'goodpass123'}}))
    .data;
  check('sign in with user ID + password', byId?.user?.email === regEmail);
  const byMail = (
    await call('/auth/password/login', {method: 'POST', body: {login: regEmail.toUpperCase(), password: 'goodpass123'}})
  ).data;
  check('sign in with email + password', byMail?.user?.username === uname);
  const wrongPw = await call('/auth/password/login', {
    method: 'POST',
    body: {login: `ghost${n}`, password: 'whatever123'},
  });
  check(
    'unknown user ID answers like a wrong password',
    wrongPw.status === 401 && wrongPw.error.message === 'Wrong user ID or password',
  );

  const pr = (await call('/auth/otp/phone/request', {method: 'POST', body: {phone: `+91 ${mobile}`}})).data;
  check('mobile code to a masked number', pr?.sent && pr.sentTo.endsWith(mobile.slice(-4)), pr);
  const byPhone = (await call('/auth/otp/phone/verify', {method: 'POST', body: {phone: mobile, code: pr.devCode}}))
    .data;
  check('sign in with mobile code', byPhone?.user?.username === uname);
  check(
    'unknown mobile has no account',
    (await call('/auth/otp/phone/request', {method: 'POST', body: {phone: '9000000001'}})).error?.code === 'NO_ACCOUNT',
  );

  const fp = (await call('/auth/password/forgot', {method: 'POST', body: {login: uname}})).data;
  check('forgot password sends a code to the email', fp?.sent && fp.sentTo.includes('•••'), fp);
  const reset = (
    await call('/auth/password/reset', {
      method: 'POST',
      body: {login: uname, code: fp.devCode, password: 'newpass4567'},
    })
  ).data;
  check('reset password signs in', reset?.user?.username === uname);
  check(
    'old password stops working',
    (await call('/auth/password/login', {method: 'POST', body: {login: uname, password: 'goodpass123'}})).status ===
      401,
  );
  await new Promise((r) => setTimeout(r, 1100)); // the wrong try above slowed this account for a second
  check(
    'new password works',
    Boolean(
      (await call('/auth/password/login', {method: 'POST', body: {login: uname, password: 'newpass4567'}})).data?.token,
    ),
  );
  check(
    'forgot user ID answers the same for anyone',
    (await call('/auth/username/forgot', {method: 'POST', body: {contact: `+91${mobile}`}})).data?.sent &&
      (await call('/auth/username/forgot', {method: 'POST', body: {contact: 'nobody@example.com'}})).data?.sent,
  );

  // An account made by email code can set its first password and pick a user ID.
  const codeOnly = await login(`codeonly${n}@example.com`);
  check(
    'first password needs no current one',
    (await call('/auth/me/password', {method: 'PATCH', token: codeOnly, body: {next: 'firstpass123'}})).data?.changed,
  );
  check(
    'pick a user ID once',
    (await call('/auth/me/username', {method: 'PATCH', token: codeOnly, body: {username: `co${n}`}})).data?.username ===
      `co${n}`,
  );
  check(
    'user ID set only once',
    (await call('/auth/me/username', {method: 'PATCH', token: codeOnly, body: {username: `co2${n}`}})).status === 409,
  );
}

// ── Account deletion ────────────────────────────────────────────────────
const leaver = await loginWithCookie(`leaver${Date.now()}@example.com`);
const leaverMe = (await call('/auth/me', {token: leaver.token})).data;
await call('/vault/credentials', {
  method: 'POST',
  token: leaver.token,
  body: {label: 'Bank', username: 'me', password: 'secret'},
});
const leaverTicket = (
  await call('/support', {method: 'POST', token: leaver.token, body: {subject: 'My PAN', message: 'PAN ABCDE1234F'}})
).data;
check(
  'ask to delete',
  (await call('/auth/me/deletion', {method: 'POST', token: leaver.token, body: {reason: 'Done'}})).status === 201,
);
check('ask once', (await call('/auth/me/deletion', {method: 'POST', token: leaver.token, body: {}})).status === 409);
check('staff cannot see deletions', (await call('/auth/admin/deletions', {token: staffToken})).status === 403);
const dreq = (await call('/auth/admin/deletions', {token: boss})).data.find((d) => d.userId === leaverMe._id);
await call('/wallet/staff/adjust', {
  method: 'POST',
  token: boss,
  body: {userId: leaverMe._id, type: 'credit', amount: 10, reason: 'Test'},
});
check(
  'cannot delete while money is held',
  (await call(`/auth/admin/deletions/${dreq._id}`, {method: 'PATCH', token: boss, body: {decision: 'approve'}})).error
    ?.code === 'HAS_BALANCE',
);
await call('/wallet/staff/adjust', {
  method: 'POST',
  token: boss,
  body: {userId: leaverMe._id, type: 'debit', amount: 10, reason: 'Test'},
});
const gone = (
  await call(`/auth/admin/deletions/${dreq._id}`, {method: 'PATCH', token: boss, body: {decision: 'approve'}})
).data;
check('deletion approved', gone?.status === 'approved', gone);
const anon = (await call(`/auth/admin/users/${leaverMe._id}`, {token: boss})).data;
check('account anonymised', anon?.email.endsWith('@deleted.invalid') && anon.suspended && !anon.name);
const keptTicket = (await call(`/support/${leaverTicket._id}`, {token: boss})).data;
check(
  'their ticket keeps no email or words',
  keptTicket?.email.endsWith('@deleted.invalid') && !JSON.stringify(keptTicket.messages).includes('ABCDE1234F'),
  keptTicket,
);
check(
  'sessions ended',
  (await fetch(B + '/auth/refresh', {method: 'POST', headers: {cookie: leaver.cookie}})).status === 401,
);
const audit2 = new Set(((await call('/auth/admin/audit', {token: boss})).data ?? []).map((r) => r.action));
check(
  'new actions are audited',
  [
    'coupon.create',
    'order.assign',
    'order.message',
    'ticket.note',
    'wallet.credit',
    'withdrawal.paid',
    'withdrawal.rejected',
    'settings.update',
    'opening.create',
    'account.delete.approve',
    'role.products',
  ].every((a) => audit2.has(a)),
  [...audit2],
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
