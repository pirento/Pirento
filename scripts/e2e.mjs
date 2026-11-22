// End-to-end flows against a running stack: npm run dev with SUPERADMIN_EMAILS=boss@example.com SUPERADMIN_STAFF_ID=root.admin SUPERADMIN_PASSWORD=change-me-now-123 OTP_RESEND_SECONDS=0.
// Usage: npm run e2e
import {bankForSlug} from '@pirento/shared/exam';
import {SANDBOX_AUTH, TEST_BHARAT_IDS, verhoeffCheckDigit} from '@pirento/shared';
import crypto from 'node:crypto';

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
check(
  'notices cannot be sent from outside',
  (
    await call('/auth/internal/notify', {
      method: 'POST',
      body: {userId: 'x', brand: 'b', label: 'l', big: 'b', note: 'n'},
    })
  ).status === 404,
);
// Card/UPI is on only when the stack has Razorpay keys (a local stand-in in tests: RAZORPAY_URL, RAZORPAY_KEY_SECRET).
const RZP = process.env.RAZORPAY_KEY_SECRET;
if (!RZP) {
  check('razorpay off', (await call(`/orders/${o._id}/pay/razorpay`, {method: 'POST', token: user})).status === 503);
  check(
    'card top-up off',
    (await call('/wallet/topup/razorpay', {method: 'POST', token: user, body: {amount: 100}})).status === 503,
  );
}
check('top-up options', (await call('/wallet/topup/config', {token: user})).data?.testTopup === true);
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

// The planting record: only on paid work, checked like checkout answers, and the customer sees it.
const plant = (id, details) => call(`/orders/staff/${id}/fulfilment`, {method: 'PATCH', token: boss, body: {details}});
const planted = {site: 'Kishangarh, Ajmer', plantedOn: '2026-11-20', lat: '26.5916', lng: '74.8543'};
check('no planting record before payment', (await plant(g.data?._id, planted)).status === 409);
await call('/wallet/topup', {method: 'POST', token: user, body: {amount: 990}});
await call(`/orders/${g.data?._id}/pay/wallet`, {method: 'POST', token: user});
check(
  'a bad planting date is refused',
  (await plant(g.data?._id, {...planted, plantedOn: '20-11-2026'})).status === 400,
);
check('legal work has no delivery record', (await plant(o._id, planted)).status === 400);
check(
  'customers cannot write the record',
  (await call(`/orders/staff/${g.data?._id}/fulfilment`, {method: 'PATCH', token: user, body: {details: planted}}))
    .status === 403,
);
await plant(g.data?._id, planted);
const seen = (await call(`/orders/${g.data?._id}`, {token: user})).data;
check(
  'the customer sees where the trees went in',
  seen?.fulfilment?.site === planted.site &&
    seen.fulfilment.lat === planted.lat &&
    seen.fulfilment.by === 'boss@example.com',
  seen?.fulfilment,
);
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
// Verification runs on Digio; the stack points DIGIO_URL at scripts/digio-standin.mjs, which /__test drives.
const DIGIO = process.env.DIGIO_STANDIN ?? 'http://127.0.0.1:4090';
const digioTest = (path, body) =>
  fetch(DIGIO + path, {
    method: body ? 'POST' : 'GET',
    headers: {'content-type': 'application/json'},
    body: body && JSON.stringify(body),
  }).then((r) => r.json());
const WEBHOOK_SECRET = process.env.DIGIO_WEBHOOK_SECRET ?? 'test-digio-webhook';
const digioHook = (event, payload, secret = WEBHOOK_SECRET) => {
  const body = JSON.stringify({
    id: `WHN${Date.now()}`,
    created_at: Date.now(),
    event,
    entities: Object.keys(payload),
    payload,
  });
  return fetch(B + '/identity/digio/webhook', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-digio-checksum': crypto.createHmac('sha256', secret).update(body).digest('hex'),
    },
    body,
  });
};
check('Digio is on', (await call('/identity/digio/config')).data?.on === true);
check(
  'video KYC required before submit',
  /video KYC/i.test((await call('/identity/submit', {method: 'POST', token: user})).error?.message ?? ''),
);
check(
  'sign waits for the KYC',
  (await call('/identity/sign/start', {method: 'POST', token: user})).error?.code === 'KYC_FIRST',
);
const kyc1 = (await call('/identity/kyc/start', {method: 'POST', token: user})).data;
check(
  'Digio tokens never sent back with the application',
  !JSON.stringify(kyc1?.doc ?? {}).includes(kyc1?.token ?? 'x'),
);
check('KYC request made on Digio', /^KID/.test(kyc1?.kycId ?? '') && /^GWT/.test(kyc1.token ?? ''), kyc1);
check(
  'reopening resumes the same KYC request',
  (await call('/identity/kyc/start', {method: 'POST', token: user})).data?.kycId === kyc1.kycId,
);
check(
  'a forged webhook is refused',
  (await digioHook('KYC_REQUEST_APPROVED', {KYC_REQUEST: {id: kyc1.kycId, status: 'APPROVED'}}, 'wrong')).status ===
    400,
);
await digioTest(`/__test/kyc/${kyc1.kycId}`, {status: 'approval_pending'});
const afterKyc = (await call('/identity/kyc/refresh', {method: 'POST', token: user})).data;
check(
  'KYC result read from Digio',
  afterKyc?.digio?.kycStatus === 'approval_pending' && afterKyc.digio.kycActions[0]?.fileId,
  afterKyc?.digio,
);
check(
  'a signed webhook updates the KYC',
  (await digioHook('KYC_REQUEST_APPROVED', {KYC_REQUEST: {id: kyc1.kycId, status: 'APPROVED'}})).status === 200 &&
    (await call('/identity/me', {token: user})).data?.digio?.kycStatus === 'approved',
);
check('an unknown event still answers 200', (await digioHook('SOMETHING.NEW', {thing: {id: 'x'}})).status === 200);
check(
  'signature required before submit',
  /sign/i.test((await call('/identity/submit', {method: 'POST', token: user})).error?.message ?? ''),
);
const sign1 = (await call('/identity/sign/start', {method: 'POST', token: user})).data;
check('declaration sent for eSign', /^DID/.test(sign1?.docId ?? '') && sign1.token, sign1);
if (process.env.DIGIO_ESTAMP_TAG) {
  const stamp = (await digioTest(`/__test/doc/${sign1.docId}`)).estamp;
  check('e-stamp attached', stamp?.tags?.[process.env.DIGIO_ESTAMP_TAG] === 1, stamp);
}
check(
  'reopening resumes the same sign request',
  (await call('/identity/sign/start', {method: 'POST', token: user})).data?.docId === sign1.docId,
);
check(
  'not signed yet',
  (await call('/identity/sign/refresh', {method: 'POST', token: user})).data?.digio?.docStatus === 'requested',
);
await digioTest(`/__test/doc/${sign1.docId}`, {status: 'completed'});
check(
  'signature read from Digio',
  (await call('/identity/sign/refresh', {method: 'POST', token: user})).data?.digio?.docStatus === 'signed',
);
const decl = await fetch(B + '/identity/declaration', {headers: {authorization: `Bearer ${user}`}});
const declPdf = Buffer.from(await decl.arrayBuffer()).toString('latin1');
check(
  'signed declaration downloads, with the details and no full Aadhaar',
  decl.status === 200 && declPdf.startsWith('%PDF') && declPdf.includes('Asha Verma') && !declPdf.includes(aadhaarNo),
);
check(
  'a PIN is set while applying, before submit',
  /PIN/.test((await call('/identity/submit', {method: 'POST', token: user})).error?.message ?? ''),
);
check(
  'the PIN step',
  (await call('/identity/pin', {method: 'PUT', token: user, body: {pin: '482916'}})).data?.pinSet === true,
);
const app1 = (await call('/identity/submit', {method: 'POST', token: user})).data;
check('submitted', app1?.status === 'submitted' && app1.fullName === 'Asha Verma' && app1.consentAt, app1);
check('locked after submit', (await put('contact', steps.contact)).status === 409);
check(
  'KYC cannot restart after submit',
  (await call('/identity/kyc/start', {method: 'POST', token: user})).status === 409,
);
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
check(
  'rejected with reason, signature voided',
  rej?.status === 'rejected' && rej.reason === 'Name does not match PAN' && !rej.digio?.docId,
  rej,
);
check(
  'editable after rejection',
  (await put('personal', {...steps.personal, fullName: 'Asha Rani Verma'})).status === 200,
);
check(
  'resubmit needs a new signature',
  /sign/i.test((await call('/identity/submit', {method: 'POST', token: user})).error?.message ?? ''),
);
const sign2 = (await call('/identity/sign/start', {method: 'POST', token: user})).data;
check('a new declaration with the fixed name', sign2?.docId && sign2.docId !== sign1.docId, sign2);
await digioHook('DOC.SIGNED', {document: {id: sign2.docId, agreement_status: 'completed'}});
check(
  'a signed webhook records the signature',
  (await call('/identity/me', {token: user})).data?.digio?.docStatus === 'signed',
);
check(
  'editing a step voids the signature',
  !(await put('work', {...steps.work, occupation: 'Self-employed'})).data?.digio?.docId,
);
const sign3 = (await call('/identity/sign/start', {method: 'POST', token: user})).data;
await digioTest(`/__test/doc/${sign3.docId}`, {status: 'completed'});
await call('/identity/sign/refresh', {method: 'POST', token: user});
const again2 = (await call('/identity/submit', {method: 'POST', token: user})).data;
check(
  'resubmitted, reason cleared',
  again2?.status === 'submitted' && !again2.reason && again2.fullName === 'Asha Rani Verma',
  again2,
);
const media = await fetch(B + `/identity/staff/${app1._id}/media/${afterKyc.digio.kycActions[0].fileId}`, {
  headers: {authorization: `Bearer ${boss}`},
});
check('staff can open the KYC video from Digio', media.status === 200);
check(
  'only this application’s files',
  (await fetch(B + `/identity/staff/${app1._id}/media/FILEOTHER`, {headers: {authorization: `Bearer ${boss}`}}))
    .status === 404,
);
check(
  'customer cannot open KYC files',
  (
    await fetch(B + `/identity/staff/${app1._id}/media/${afterKyc.digio.kycActions[0].fileId}`, {
      headers: {authorization: `Bearer ${user}`},
    })
  ).status === 403,
);
check(
  'staff can read the signed declaration',
  (await fetch(B + `/identity/staff/${app1._id}/declaration`, {headers: {authorization: `Bearer ${boss}`}})).status ===
    200,
);
check(
  'vault waits for an issued Bharat ID',
  (await call('/vault/credentials', {token: user})).error?.code === 'NEEDS_BHARAT_ID',
);
check(
  'Pirento One waits for an issued Bharat ID',
  (await call('/orders/partner/join', {method: 'POST', token: user})).error?.code === 'NEEDS_BHARAT_ID',
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

// ── Bharat ID for Business ──────────────────────────────────────────────
// A request from the public page → staff approve → an account by email → test keys and the sandbox →
// company details and the owner's own Bharat ID → live keys → a consent the holder allows, then revokes.
{
  const T = TEST_BHARAT_IDS;
  const bizReq = (over = {}) => ({
    company: 'Asha Bank',
    type: 'Bank',
    website: 'https://ashabank.example',
    contactName: 'Asha Rao',
    designation: 'Head of KYC',
    email: `biz${Date.now()}@example.com`,
    mobile: '9876500000',
    useCase: 'KYC for new savings accounts',
    volume: 'Under 1,000',
    acceptTerms: true,
    ...over,
  });
  const ask = (body) => call('/identity/business/requests', {method: 'POST', body});
  const api = (path, key, opts = {}) =>
    call(`/identity/v1${path}`, {...opts, headers: {authorization: `Bearer ${key}`}});
  const decide = (id, decision, reason = '') =>
    call(`/identity/staff/business/${id}`, {method: 'PATCH', token: boss, body: {decision, reason}});

  check('business request needs the terms', (await ask(bizReq({acceptTerms: false}))).status === 400);
  check('business request checks the website', (await ask(bizReq({website: 'ashabank'}))).status === 400);
  check('a bot filling the hidden field is not kept', (await ask(bizReq({website_confirm: 'x'}))).status === 201);
  const reqA = bizReq();
  check('business request received', (await ask(reqA)).status === 201);
  check('one open request per email', (await ask(reqA)).error?.code === 'ALREADY_ASKED');
  check(
    'customers cannot see business requests',
    (await call('/identity/staff/business', {token: user})).status === 403,
  );
  const queued = (await call('/identity/staff/business', {token: boss})).data?.find(
    (b) => b.request.email === reqA.email,
  );
  check('request in the staff queue', queued?.status === 'requested', queued);

  const approved = (await decide(queued._id, 'approve')).data;
  const allow = (id, methods, fields) =>
    call(`/identity/staff/business/${id}/access`, {method: 'PATCH', token: boss, body: {methods, fields}});
  check(
    'customers cannot set business access',
    (
      await call(`/identity/staff/business/${queued._id}/access`, {
        method: 'PATCH',
        token: user,
        body: {methods: [], fields: []},
      })
    ).status === 403,
  );
  check('expected methods cannot be allowed', (await allow(queued._id, ['iris'], [])).status === 400);
  check(
    'staff set what a business may do',
    (await allow(queued._id, ['pin_dob', 'otp'], ['name', 'pan'])).data?.fields.length === 2,
  );
  check('approve makes the account', approved?.status === 'test' && approved.userId && approved.devPassword, approved);
  check('approved once', (await decide(queued._id, 'approve')).status === 409);
  const bizLogin = (
    await call('/auth/password/login', {method: 'POST', body: {login: reqA.email, password: approved.devPassword}})
  ).data;
  check('business signs in with the emailed password', Boolean(bizLogin?.token));
  const biz = bizLogin.token;
  const meA = (await call('/identity/business/me', {token: biz})).data;
  check('business dashboard data', meA?.business.status === 'test' && meA.ownerIdIssued === false, meA);
  check(
    'no live keys before live access',
    (await call('/identity/business/me/keys', {method: 'POST', token: biz, body: {mode: 'live'}})).status === 403,
  );
  const testKey = (
    await call('/identity/business/me/keys', {method: 'POST', token: biz, body: {mode: 'test', label: 'CI'}})
  ).data;
  check('test key made, shown once', /^bid_test_/.test(testKey?.key ?? ''), testKey);
  check(
    'keys are never listed in full',
    !JSON.stringify((await call('/identity/business/me', {token: biz})).data).includes(testKey.key),
  );
  check('API needs a key', (await call(`/identity/v1/ids/${T.approves}`)).error?.code === 'NO_KEY');
  check('API refuses a wrong key', (await api(`/ids/${T.approves}`, 'bid_test_' + 'x'.repeat(32))).status === 401);
  const sandboxId = (await api(`/ids/${T.approves}`, testKey.key)).data;
  check(
    'sandbox verify',
    sandboxId?.issued === true && sandboxId.name === 'Asha T.' && sandboxId.mode === 'test',
    sandboxId,
  );
  check('sandbox knows only the test IDs', (await api(`/ids/${appr.bharatId}`, testKey.key)).status === 404);
  const sc = (
    await api('/consents', testKey.key, {
      method: 'POST',
      body: {bharatId: T.approves, purpose: 'Open an account', fields: ['name', 'pan']},
    })
  ).data;
  check('sandbox consent approves', sc?.status === 'approved', sc);
  const scRead = (await api(`/consents/${sc.id}`, testKey.key)).data;
  check(
    'sandbox details, only the fields asked for',
    scRead?.details?.name === 'Asha Test' && scRead.details.pan && !('dob' in scRead.details),
    scRead,
  );
  check(
    'sandbox consent can decline',
    (
      await api('/consents', testKey.key, {
        method: 'POST',
        body: {bharatId: T.declines, purpose: 'Open an account', fields: ['name']},
      })
    ).data?.status === 'declined',
  );
  check(
    'a field our team did not allow is refused',
    (
      await api('/consents', testKey.key, {
        method: 'POST',
        body: {bharatId: T.approves, purpose: 'Open an account', fields: ['dob']},
      })
    ).error?.code === 'FIELD_NOT_ALLOWED',
  );
  check(
    'unknown consent fields refused',
    (
      await api('/consents', testKey.key, {
        method: 'POST',
        body: {bharatId: T.approves, purpose: 'x y z', fields: ['bank']},
      })
    ).status === 400,
  );
  check(
    'live needs company details',
    (await call('/identity/business/me/live', {method: 'POST', token: biz})).error?.code === 'INCOMPLETE',
  );
  const profile = {
    legalName: 'Asha Bank Limited',
    entity: 'Public limited company',
    registrationNo: 'U12345MH2020PLC123456',
    pan: 'AAACB1234C',
    line: '1 Main Road',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    signatoryName: 'Asha Rao',
    signatoryDesignation: 'Director',
  };
  check(
    'company PAN checked',
    (await call('/identity/business/me/profile', {method: 'PUT', token: biz, body: {...profile, pan: 'NOPE'}}))
      .status === 400,
  );
  await call('/identity/business/me/profile', {method: 'PUT', token: biz, body: profile});
  check(
    "live needs the owner's own Bharat ID",
    (await call('/identity/business/me/live', {method: 'POST', token: biz})).error?.code === 'NEEDS_BHARAT_ID',
  );
  await call(`/identity/business/me/keys/${testKey.id}`, {method: 'DELETE', token: biz});
  check('a revoked key stops working', (await api(`/ids/${T.approves}`, testKey.key)).status === 401);

  // Business B: its owner is `user`, whose Bharat ID is issued, so it can go live.
  const userEmail = (await call('/auth/me', {token: user})).data?.email;
  check(
    'request from an existing account',
    (await ask(bizReq({email: userEmail, company: 'Verma Institute', type: 'Coaching or training institute'})))
      .status === 201,
  );
  const reqB = (await call('/identity/staff/business', {token: boss})).data?.find((b) => b.request.email === userEmail);
  const appB = (await decide(reqB._id, 'approve')).data;
  check('an existing account is linked, no new password', appB?.status === 'test' && !appB.devPassword, appB);
  await allow(reqB._id, ['pin_dob', 'otp'], ['name', 'pan']);
  await call('/identity/business/me/profile', {
    method: 'PUT',
    token: user,
    body: {...profile, legalName: 'Verma Institute LLP', entity: 'LLP'},
  });
  check(
    'live requested',
    (await call('/identity/business/me/live', {method: 'POST', token: user})).data?.status === 'live_review',
  );
  check(
    'profile locked while in review',
    (await call('/identity/business/me/profile', {method: 'PUT', token: user, body: profile})).status === 409,
  );
  check('send back needs a reason', (await decide(reqB._id, 'sendBack')).status === 400);
  check('staff opens live', (await decide(reqB._id, 'live')).data?.status === 'live');
  const liveKey = (await call('/identity/business/me/keys', {method: 'POST', token: user, body: {mode: 'live'}})).data;
  check('live key made', /^bid_live_/.test(liveKey?.key ?? ''), liveKey);
  const realId = (await api(`/ids/${appr.bharatId}`, liveKey.key)).data;
  check('live verify', realId?.issued === true && realId.name === 'Asha V.' && realId.mode === 'live', realId);
  check('live does not answer for sandbox IDs', (await api(`/ids/${T.approves}`, liveKey.key)).status === 404);
  const lc = (
    await api('/consents', liveKey.key, {
      method: 'POST',
      body: {bharatId: appr.bharatId, purpose: 'Course admission', fields: ['name', 'pan'], reference: 'ADM-1'},
    })
  ).data;
  check('live consent waits for the holder', lc?.status === 'pending' && !lc.details, lc);
  const held = (await call('/identity/consents', {token: user})).data?.find((c) => c._id === lc.id);
  check('the holder sees the request', held?.businessName === 'Verma Institute LLP' && held.fields.length === 2, held);
  check(
    'the holder allows it',
    (await call(`/identity/consents/${lc.id}`, {method: 'POST', token: user, body: {decision: 'approve'}})).data
      ?.status === 'approved',
  );
  check(
    'decided once',
    (await call(`/identity/consents/${lc.id}`, {method: 'POST', token: user, body: {decision: 'approve'}})).status ===
      409,
  );
  const lcRead = (await api(`/consents/${lc.id}`, liveKey.key)).data;
  check(
    'live details: only what was allowed',
    lcRead?.details?.name === 'Asha Rani Verma' && lcRead.details.pan === 'ABCDE1234F' && !('dob' in lcRead.details),
    lcRead,
  );
  check('another business cannot read it', (await api(`/consents/${lc.id}`, testKey.key)).status === 401);
  await call(`/identity/consents/${lc.id}`, {method: 'POST', token: user, body: {decision: 'revoke'}});
  check('a revoke stops the details', !(await api(`/consents/${lc.id}`, liveKey.key)).data?.details);
  check('suspend needs a reason', (await decide(reqB._id, 'suspend')).status === 400);
  await decide(reqB._id, 'suspend', 'Checking unusual traffic');
  check(
    'a suspended business is refused',
    (await api(`/ids/${appr.bharatId}`, liveKey.key)).error?.code === 'NOT_ALLOWED',
  );
  check('restored to live', (await decide(reqB._id, 'restore')).data?.status === 'live');
  check('works again after restore', (await api(`/ids/${appr.bharatId}`, liveKey.key)).status === 200);

  // The holder's PIN, and signing in to Pirento with Bharat ID, PIN and date of birth.
  const DOB = '1990-05-01';
  check(
    'a weak PIN is refused',
    (await call('/identity/pin', {method: 'PUT', token: user, body: {pin: '123456'}})).status === 400,
  );
  check('the PIN set while applying is kept', (await call('/identity/me', {token: user})).data?.pinSet === true);
  check(
    'the PIN hash never leaves',
    !JSON.stringify((await call('/identity/me', {token: user})).data).includes('scrypt'),
  );
  check(
    'changing the PIN needs the current one',
    (await call('/identity/pin', {method: 'PUT', token: user, body: {pin: '582917'}})).status === 401,
  );
  check(
    'the PIN changes with the current one',
    (await call('/identity/pin', {method: 'PUT', token: user, body: {pin: '482916', currentPin: '482916'}})).status ===
      200,
  );
  const pinLogin = (pin, dob = DOB) =>
    call('/auth/otp/bharat-id/pin', {method: 'POST', body: {bharatId: appr.bharatId, pin, dob}});
  check('sign in with Bharat ID, PIN and date of birth', Boolean((await pinLogin('482916')).data?.token));
  check(
    'a wrong date of birth answers like a wrong PIN',
    (await pinLogin('482916', '1991-05-01')).error?.code === 'PIN_WRONG',
  );

  // Checking a holder: the business sends them to Pirento's page; it never sees what they type.
  const testKey2 = (await call('/identity/business/me/keys', {method: 'POST', token: biz, body: {mode: 'test'}})).data
    .key;
  const back = 'https://ashabank.example/kyc/back';
  const startAuth = (key, body) => api('/auth/sessions', key, {method: 'POST', body: {returnUrl: back, ...body}});
  check(
    'a method our team did not allow is refused',
    (await startAuth(testKey2, {bharatId: T.approves, method: 'face'})).error?.code === 'METHOD_NOT_ALLOWED',
  );
  check(
    'biometrics are not available yet',
    (await startAuth(testKey2, {bharatId: T.approves, method: 'iris'})).status === 501,
  );
  check(
    'the return address must be on their own website',
    (await startAuth(testKey2, {bharatId: T.approves, method: 'pin_dob', returnUrl: 'https://evil.example/x'})).error
      ?.code === 'BAD_RETURN_URL',
  );
  const linkOf = (url) => {
    const u = new URL(url);
    return {id: u.pathname.split('/').pop(), t: u.searchParams.get('t')};
  };
  const s1 = (await startAuth(testKey2, {bharatId: T.approves, method: 'pin_dob', reference: 'LOGIN-1'})).data;
  check(
    'check session made with a Pirento link',
    s1?.status === 'pending' && s1.url.includes('/bharat-id/authorize/'),
    s1,
  );
  const l1 = linkOf(s1.url);
  check('the link needs its secret', (await call(`/identity/authorize/${l1.id}?t=wrong`)).status === 404);
  check(
    'the page shows who asks and how',
    (await call(`/identity/authorize/${l1.id}?t=${l1.t}`)).data?.businessName === 'Asha Bank Limited',
  );
  const verify = (l, body) => call(`/identity/authorize/${l.id}/verify`, {method: 'POST', body: {t: l.t, ...body}});
  check(
    'a wrong sandbox PIN is a wrong try',
    (await verify(l1, {pin: '000001', dob: SANDBOX_AUTH.dob})).data?.wrong === true,
  );
  const ok1 = (await verify(l1, {pin: SANDBOX_AUTH.pin, dob: SANDBOX_AUTH.dob})).data;
  check(
    'sandbox check passes, back to their site',
    ok1?.status === 'passed' && ok1.returnTo.startsWith(`${back}?session=`),
    ok1,
  );
  check('the business reads the result', (await api(`/auth/sessions/${s1.id}`, testKey2)).data?.status === 'passed');
  const s2 = (await startAuth(testKey2, {bharatId: T.declines, method: 'otp'})).data;
  check(
    'the sandbox decline ID fails',
    (await verify(linkOf(s2.url), {emailCode: SANDBOX_AUTH.code, mobileCode: SANDBOX_AUTH.code})).data?.status ===
      'failed',
  );
  const s3 = (await startAuth(liveKey.key, {bharatId: appr.bharatId, method: 'pin_dob'})).data;
  const l3 = linkOf(s3.url);
  check('live: a wrong PIN is a wrong try', (await verify(l3, {pin: '111222', dob: DOB})).data?.triesLeft === 4);
  check(
    'live: the holder passes with their PIN',
    (await verify(l3, {pin: '482916', dob: DOB})).data?.status === 'passed',
  );
  const s4 = (await startAuth(liveKey.key, {bharatId: appr.bharatId, method: 'otp'})).data;
  check(
    'live codes need a verified mobile on the account',
    (await call(`/identity/authorize/${linkOf(s4.url).id}/start`, {method: 'POST', body: {t: linkOf(s4.url).t}})).error
      ?.code === 'NO_MOBILE',
  );
  const seen = (await call('/identity/consents/log', {token: user})).data ?? [];
  check(
    'the holder sees who checked them',
    seen.some((r) => r.action === 'auth.request' && r.businessName === 'Verma Institute LLP') &&
      !JSON.stringify(seen).includes('"ip"'),
  );
  check(
    "staff see a business's log",
    (await call(`/identity/staff/business/${reqB._id}/log`, {token: boss})).data?.length > 3,
  );

  // Prepaid: live calls are paid from the owner's wallet at the price a superadmin sets.
  const prices = {verify: 2, consent: 3, pin_dob: 5, otp: 5, aadhaar_otp: 20, face: 20};
  check(
    'only a superadmin sets prices',
    (await call('/identity/staff/business/prices', {method: 'PUT', token: user, body: prices})).status === 403,
  );
  check(
    'prices set',
    (await call('/identity/staff/business/prices', {method: 'PUT', token: boss, body: prices})).data?.verify === 200,
  );
  const balance = async () => (await call('/wallet', {token: user})).data.balance;
  const before = await balance();
  await api(`/ids/${appr.bharatId}`, liveKey.key);
  check('a live verify is charged', before - (await balance()) === 200);
  await api(`/ids/${T.approves}`, testKey2);
  check('test calls are free', before - (await balance()) === 200);
  await call('/identity/staff/business/prices', {method: 'PUT', token: boss, body: {...prices, verify: 100000}});
  check(
    'not enough credit stops the call',
    (await api(`/ids/${appr.bharatId}`, liveKey.key)).error?.code === 'INSUFFICIENT_CREDIT',
  );
  await call('/identity/staff/business/prices', {
    method: 'PUT',
    token: boss,
    body: Object.fromEntries(Object.keys(prices).map((k) => [k, 0])),
  });
  check(
    'the dashboard shows the prices',
    (await call('/identity/business/me', {token: user})).data?.prices.verify === 0,
  );

  // Last, as it locks this PIN for 15 minutes: five wrong tries in a row lock it, even for the right PIN.
  for (let i = 0; i < 5; i++) await pinLogin('999888');
  check('the PIN locks after five wrong tries', (await pinLogin('482916')).error?.code === 'PIN_LOCKED');

  const reqC = bizReq({company: 'Nope Ltd'});
  await ask(reqC);
  const c = (await call('/identity/staff/business', {token: boss})).data?.find((b) => b.request.email === reqC.email);
  check('reject needs a reason', (await decide(c._id, 'reject')).status === 400);
  check('rejected', (await decide(c._id, 'reject', 'We could not confirm the company')).data?.status === 'rejected');
  check('a rejected email may ask again', (await ask(reqC)).status === 201);
}

// ── Intern exam ─────────────────────────────────────────────────────────
// Two "start"s at the same moment get one attempt, not two.
const racer = await login(`racer${Date.now()}@example.com`);
const starts = await Promise.all(
  [1, 2, 3].map(() =>
    call('/learning/exam/start', {method: 'POST', token: racer, body: {track: 'design', fullName: 'Ravi Kumar'}}),
  ),
);
check(
  'parallel starts share one attempt',
  starts.every((r) => r.status === 200) && new Set(starts.map((r) => r.data.id)).size === 1,
  starts.map((r) => r.status),
);
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
  // 403 for someone without a Bharat ID, 404 for anyone else: either way, never the file.
  [403, 404].includes(
    (await fetch(B + `/vault/files/${file._id}`, {headers: {authorization: `Bearer ${boss}`}})).status,
  ),
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
check(
  'a file deleted twice gives its space back once',
  (await call(`/vault/files/${file._id}`, {method: 'DELETE', token: user})).status === 404,
);
await call('/vault/credentials', {
  method: 'POST',
  token: user,
  body: {label: 'Mail', username: 'asha', password: 'p@ss'},
});
await call('/vault/credentials', {
  method: 'POST',
  token: user,
  body: {label: 'Shop', username: 'asha', password: 'Monsoon-Train-42'},
});
const health = await call('/vault/credentials/health', {token: user});
check(
  'password health: weak and reused, never the password',
  health.data?.weak === 2 &&
    health.data.reused === 2 &&
    health.data.items.length === 3 &&
    !JSON.stringify(health).includes('p@ss') &&
    !JSON.stringify(health).includes('Monsoon'),
  health.data,
);
check(
  'health is per person',
  ((r) => r.status === 403 || r.data?.items.every((i) => i._id !== cred._id))(
    await call('/vault/credentials/health', {token: boss}),
  ),
);
const usage = (await call('/ai/usage', {token: user})).data;
check('AI usage meter', usage?.limit === 30 && usage.used === 0, usage);

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

// ── Admin: booking a service for a customer ────────────────────────────
const customerMe = (await call('/auth/me', {token: user})).data;
const bookFor = customerMe.email.slice(0, 8);
check(
  'operations can find a customer to book for',
  ((await call(`/auth/admin/customers?q=${encodeURIComponent(bookFor)}`, {token: staffToken})).data ?? []).some(
    (c) => c._id === customerMe._id && c.passwordHash === undefined && c.role === undefined,
  ),
);
check('customers cannot search customers', (await call('/auth/admin/customers?q=exam', {token: user})).status === 403);
const book = (token, body) => call('/orders/staff/book', {method: 'POST', token, body});
const bookedRes = await book(staffToken, {
  userId: customerMe._id,
  serviceSlug: 'gst-registration',
  intake,
  note: 'As discussed on the call',
  amount: 1,
});
const booked = bookedRes.data;
check(
  'staff book a service for a customer',
  bookedRes.status === 201 && booked.status === 'pending_payment' && booked.userId === customerMe._id,
  bookedRes,
);
const gstPrice = (await call('/catalog/prices')).data?.['gst-registration']?.price ?? 999;
check('a booking is priced by the server', booked?.amount === gstPrice * 100 && booked.bookedBy?.email);
const foundOrder = (await call(`/orders/staff/queue?q=${booked?.orderNo}`, {token: staffToken})).data ?? [];
check('find an order by number, any status', foundOrder.length === 1 && foundOrder[0].status === 'pending_payment');
check(
  'find orders by customer email',
  ((await call(`/orders/staff/queue?q=${encodeURIComponent(customerMe.email)}`, {token: boss})).data ?? []).every(
    (o) => o.email === customerMe.email,
  ),
);
check(
  'the customer sees the booking and the note',
  (await call(`/orders/${booked?._id}`, {token: user})).data?.messages?.[0]?.body === 'As discussed on the call',
);
check(
  'booking checks the answers',
  (await book(staffToken, {userId: customerMe._id, serviceSlug: 'gst-registration'})).status === 400,
);
check(
  'booking needs a customer account',
  (await book(staffToken, {userId: bossId, serviceSlug: 'gst-registration', intake})).status === 400,
);
check('customers cannot book', (await book(user, {})).status === 403);

// ── Admin: staff roles, panels, suspension, audit trail ─────────────────
const sup = await loginWithCookie(`support${Date.now()}@example.com`);
const supUser = (await call(`/auth/admin/users?q=${encodeURIComponent('support')}`, {token: boss})).data.users[0];
await call(`/auth/admin/users/${supUser._id}/role`, {method: 'PATCH', token: boss, body: {role: 'support'}});
const supToken = (await loginWithCookie(supUser.email)).token;

// ── Staff start a Bharat ID for someone who is not signed in ───────────────
{
  const who = `walkin${Date.now()}@example.com`;
  const enrol = (token, body) => call('/identity/staff/enrol', {method: 'POST', token, body});
  const body = {email: who, name: 'Ravi Kumar', mobile: '9876500005', agreed: true};
  check('customers cannot start one for someone', (await enrol(user, body)).status === 403);
  check('the terms must be confirmed', (await enrol(supToken, {...body, agreed: false})).status === 400);
  check('the mobile is checked', (await enrol(supToken, {...body, mobile: '12345'})).status === 400);
  const en = (await enrol(supToken, body)).data;
  check(
    'any staffer starts it; the link goes by email and SMS',
    en?.nextStep === 'Personal details' && en.sent?.email && en.sent.sms && en.sent.devLink && en.enrolledBy?.email,
    en,
  );
  check(
    'they see what they started',
    (await call('/identity/staff/enrol', {token: supToken})).data?.some((d) => d._id === en._id),
  );
  check('customers cannot list them', (await call('/identity/staff/enrol', {token: user})).status === 403);
  const step = (
    await call(`/identity/staff/enrol/${en._id}/draft/personal`, {
      method: 'PUT',
      token: supToken,
      body: {fullName: 'Ravi Kumar', fatherName: 'Mohan Kumar', dob: '1988-02-03', gender: 'Male'},
    })
  ).data;
  check('the staffer fills a step with them', step?.nextStep === 'Identity documents', step);
  const linkToken = new URL(en.sent.devLink).searchParams.get('token');
  const viaLink = (await call('/auth/otp/link', {method: 'POST', body: {token: linkToken}})).data;
  check('the link signs them in, no password or code', Boolean(viaLink?.token) && viaLink.user.email === who);
  check(
    'the link works once',
    (await call('/auth/otp/link', {method: 'POST', body: {token: linkToken}})).error?.code === 'LINK_INVALID',
  );
  const theirs = (await call('/identity/me', {token: viaLink.token})).data;
  check(
    'they carry on where the staffer stopped',
    theirs?.sections?.personal?.fullName === 'Ravi Kumar' && theirs.reminders?.nextAt,
  );
  const again = (await call(`/identity/staff/enrol/${en._id}/remind`, {method: 'POST', token: supToken})).data;
  check('the link can be sent again', again?.devLink && again.devLink !== en.sent.devLink);
  // Enrolment centres: a QR that starts an application on the person's own phone.
  check(
    'support cannot make centres',
    (await call('/identity/staff/centres', {method: 'POST', token: supToken, body: {name: 'Main desk', city: 'Delhi'}}))
      .status === 403,
  );
  const centre = (
    await call('/identity/staff/centres', {method: 'POST', token: boss, body: {name: 'Main desk', city: 'Delhi'}})
  ).data;
  check('centre made with a QR code', /^[A-Z0-9]{6}$/.test(centre?.code ?? ''), centre);
  check('anyone sees an open centre', (await call(`/identity/centres/${centre.code}`)).data?.name === 'Main desk');
  const walker = await login(`qr${Date.now()}@example.com`);
  check(
    'an unknown centre is refused',
    (await call('/identity/start', {method: 'POST', token: walker, body: {centre: 'ZZZZZZ'}})).error?.code ===
      'CENTRE_CLOSED',
  );
  const fromQr = (
    await call('/identity/start', {method: 'POST', token: walker, body: {centre: centre.code.toLowerCase()}})
  ).data;
  check(
    'scanning starts the application at the centre',
    fromQr?.status === 'draft' && fromQr.centre?.code === centre.code,
    fromQr,
  );
  check(
    'staff see what the QR started',
    (await call('/identity/staff/centres', {token: supToken})).data?.find((c) => c.code === centre.code)?.counts
      ?.draft === 1,
  );
  await call(`/identity/staff/centres/${centre._id}`, {
    method: 'PATCH',
    token: boss,
    body: {name: 'Main desk', city: 'Delhi', active: false},
  });
  check('a closed centre stops starting applications', (await call(`/identity/centres/${centre.code}`)).status === 404);
  const userEmail = (await call('/auth/me', {token: user})).data?.email;
  check(
    'not for someone already issued',
    (await enrol(supToken, {...body, email: userEmail})).error?.code === 'ALREADY_APPLIED',
  );
}
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
// The partner is `user`, who holds an issued Bharat ID by now; `buyer` orders through their link.
const buyer = await login(`buyer${Date.now()}@example.com`);
const partner = (await call('/orders/partner/join', {method: 'POST', token: user})).data;
check('partner code', /^P[0-9A-F]{6}$/.test(partner?.code ?? ''), partner);
check(
  'join is idempotent',
  (await call('/orders/partner/join', {method: 'POST', token: user})).data?.code === partner.code,
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
      token: buyer,
      body: {serviceSlug: 'giftox-diwali-collection', intake: {...gift, address: ''}},
    })
  ).status === 400,
);
const go = (
  await call('/orders', {
    method: 'POST',
    token: buyer,
    body: {serviceSlug: 'giftox-diwali-collection', quantity: 2, ref: partner.code.toLowerCase(), intake: gift},
  })
).data;
check('gift order with referral', go?.amount === 399800 && go.ref === partner.code, go);
const own = (
  await call('/orders', {
    method: 'POST',
    token: user,
    body: {serviceSlug: 'giftox-welcome-kit', ref: partner.code, intake: gift},
  })
).data;
check('own code is ignored', own && !own.ref);
const pm = (await call('/orders/partner/me', {token: user})).data;
check(
  'partner sees referred order without customer data',
  pm?.orders.length === 1 && !JSON.stringify(pm).includes('9876500000') && !JSON.stringify(pm).includes('@'),
  pm,
);

// Plans: made in admin; the free plan's rate, then a paid plan bought from the wallet, decide the commission.
const planBody = {features: ['Your own link'], recommended: false, active: true, sort: 0};
check(
  'staff cannot make plans',
  (
    await call('/orders/staff/partner-plans', {
      method: 'POST',
      token: staffToken,
      body: {...planBody, name: 'X', price: 0, months: 0, commissionPct: 5},
    })
  ).status === 403,
);
check(
  'a paid plan needs months',
  (
    await call('/orders/staff/partner-plans', {
      method: 'POST',
      token: boss,
      body: {...planBody, name: 'Bad', price: 999, months: 0, commissionPct: 10},
    })
  ).status === 400,
);
const freeP = (
  await call('/orders/staff/partner-plans', {
    method: 'POST',
    token: boss,
    body: {...planBody, name: 'Free', price: 0, months: 0, commissionPct: 5},
  })
).data;
const proP = (
  await call('/orders/staff/partner-plans', {
    method: 'POST',
    token: boss,
    body: {...planBody, name: 'Pro', price: 999, months: 12, commissionPct: 15, recommended: true, sort: 1},
  })
).data;
check('plans are public', (await call('/orders/partner-plans')).data?.length >= 2);
check(
  'a new partner is on the free plan',
  (await call('/orders/partner/me', {token: user})).data?.plan?.name === 'Free',
);
const completeReferred = async () => {
  const ro = (
    await call('/orders', {
      method: 'POST',
      token: buyer,
      body: {serviceSlug: 'giftox-welcome-kit', ref: partner.code, intake: gift},
    })
  ).data;
  await call('/wallet/topup', {method: 'POST', token: buyer, body: {amount: ro.amount / 100}});
  await call(`/orders/${ro._id}/pay/wallet`, {method: 'POST', token: buyer});
  await call(`/orders/staff/${ro._id}`, {method: 'PATCH', token: boss, body: {status: 'in_progress', note: ''}});
  const fin = (
    await call(`/orders/staff/${ro._id}`, {method: 'PATCH', token: boss, body: {status: 'completed', note: ''}})
  ).data;
  return {ro, fin};
};
{
  const before = (await call('/wallet', {token: user})).data.balance;
  const {ro, fin} = await completeReferred();
  const due = Math.floor((ro.amount * 5) / 100);
  check(
    'free plan rate fixed on completion',
    fin?.commission?.amount === due && fin.commission.pct === 5,
    fin?.commission,
  );
  const after = (await call('/wallet', {token: user})).data.balance;
  check('commission lands in the partner wallet', after - before === due, {before, after, due});
  const again = (await call('/orders/staff/partners/pay-owed', {method: 'POST', token: boss})).data;
  check(
    'nothing owed, nothing paid twice',
    again?.paid === 0 && (await call('/wallet', {token: user})).data.balance === after,
    again,
  );
  const row = (await call('/orders/staff/partners', {token: boss})).data?.find((p) => p.code === partner.code);
  check('admin sees commission paid', row?.earned === due && row.owed === 0, row);
  check(
    'a customer cannot send commission',
    (await call('/orders/staff/partners/pay-owed', {method: 'POST', token: buyer})).status === 403,
  );
  const mine = (await call('/orders/partner/me', {token: user})).data?.orders.find((x) => x._id === ro._id);
  check('partner sees the commission', mine?.commission?.paid === true && mine.commission.amount === due, mine);
}
{
  // Two buys at once, the way a double click sends them: one charge, one plan.
  check(
    'the free plan is not bought',
    (await call('/orders/partner/plan', {method: 'POST', token: user, body: {planId: freeP._id}})).error?.code ===
      'FREE_PLAN',
  );
  await call('/wallet/topup', {method: 'POST', token: user, body: {amount: 999}});
  const start = (await call('/wallet', {token: user})).data.balance;
  const buys = await Promise.all(
    [1, 2].map(() => call('/orders/partner/plan', {method: 'POST', token: user, body: {planId: proP._id}})),
  );
  check(
    'buy a paid plan',
    buys.every((b) => b.data?.plan?.name === 'Pro'),
    buys.map((b) => b.error),
  );
  check('a double click pays once', start - (await call('/wallet', {token: user})).data.balance === 99900);
  const {ro, fin} = await completeReferred();
  check('paid plan rate', fin?.commission?.pct === 15 && fin.commission.amount === Math.floor((ro.amount * 15) / 100));
  await call(`/orders/staff/partner-plans/${proP._id}`, {
    method: 'PATCH',
    token: boss,
    body: {...planBody, name: 'Pro', price: 999, months: 12, commissionPct: 20, recommended: true, sort: 1},
  });
  check(
    'a bought plan keeps its rate',
    (await call('/orders/partner/me', {token: user})).data?.plan?.commissionPct === 15,
  );
  check(
    'admin lists the plan',
    (await call('/orders/staff/partners', {token: boss})).data?.find((p) => p.code === partner.code)?.plan?.name ===
      'Pro',
  );
}
await call(`/orders/staff/partner-plans/${proP._id}`, {
  method: 'PATCH',
  token: boss,
  body: {...planBody, name: 'Pro', price: 999, months: 12, commissionPct: 20, active: false},
});
check('a retired plan is not offered', !(await call('/orders/partner-plans')).data?.some((p) => p._id === proP._id));

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
// A code counts only when an order is paid, so a second unpaid order with a one-use code still goes through.
const disc2 = await call('/orders', {
  method: 'POST',
  token: user,
  body: {serviceSlug: 'giftox-welcome-kit', coupon: code, intake: gift},
});
check('an unpaid order leaves a one-use code free', disc2.status === 201, disc2);
await call(`/orders/${disc2.data?._id}/cancel`, {method: 'POST', token: user});
await call(`/orders/staff/coupons/${cp._id}`, {method: 'PATCH', token: boss, body: {active: false}});
check(
  'orders placed with the code',
  (await call(`/orders/staff/coupons/${cp._id}/orders`, {token: boss})).data?.length === 2,
);

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
check(
  'team message without status change',
  noted?.status === 'pending_payment' &&
    noted.messages.at(-1).from === 'team' &&
    noted.messages.at(-1).body === 'Box packed',
);
check(
  'customer sees the message',
  (await call(`/orders/${disc._id}`, {token: user})).data?.messages.at(-1).body === 'Box packed',
);
const replied = (
  await call(`/orders/${disc._id}/messages`, {method: 'POST', token: user, body: {body: 'Thank you, please gift wrap'}})
).data;
check('customer writes back', replied?.messages.at(-1).from === 'customer');
check(
  'only the owner writes as the customer',
  (await call(`/orders/${disc._id}/messages`, {method: 'POST', token: staffToken, body: {body: 'Hello'}})).status ===
    404,
);

// ── Documents on an order ───────────────────────────────────────────────
const uploadDoc = (token, name, text) =>
  fetch(`${B}/orders/${disc._id}/files`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/octet-stream',
      'x-file-name': encodeURIComponent(name),
      'x-file-type': 'text/plain',
    },
    body: text,
  }).then(async (r) => ({status: r.status, ...(await r.json())}));
const mineFile = await uploadDoc(user, 'PAN card.txt', 'my pan');
check('customer adds a document', mineFile.status === 201 && mineFile.data.from === 'customer', mineFile);
const teamFile = await uploadDoc(staffToken, 'Filed form.txt', 'done');
check('team sends a document', teamFile.status === 201 && teamFile.data.from === 'team', teamFile);
const listed = (await call(`/orders/${disc._id}/files`, {token: user})).data;
check('both sides see both documents', listed?.length === 2 && !('data' in listed[0]));
const got = await fetch(`${B}/orders/${disc._id}/files/${teamFile.data._id}`, {
  headers: {authorization: `Bearer ${user}`},
});
check(
  'download comes back decrypted, as an attachment',
  (await got.text()) === 'done' && got.headers.get('content-disposition')?.startsWith('attachment'),
);
check(
  "a customer cannot remove the team's document",
  (await call(`/orders/${disc._id}/files/${teamFile.data._id}`, {method: 'DELETE', token: user})).status === 403,
);
const otherUser = await login(`docs${Date.now()}@example.com`);
check(
  "nobody else sees an order's documents",
  (await call(`/orders/${disc._id}/files`, {token: otherUser})).status === 404 &&
    (await uploadDoc(otherUser, 'x.txt', 'x')).status === 404,
);
check('my documents across orders', (await call('/orders/files/mine', {token: user})).data?.length >= 2);
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
// One support desk: a ticket says which product it came from, and a made-up product is refused.
const fromLegal = (
  await call('/support', {
    method: 'POST',
    token: user,
    body: {subject: 'About my GST order', message: 'When will it be done?', product: 'legal'},
  })
).data;
check('a ticket keeps the product it came from', fromLegal?.product === 'legal');
check(
  'an unknown product is refused',
  (
    await call('/support', {
      method: 'POST',
      token: user,
      body: {subject: 'Hello', message: 'Hi there', product: 'mars'},
    })
  ).status === 400,
);
const tk = (
  await call('/support', {method: 'POST', token: user, body: {subject: 'Capital waitlist', message: 'A shop loan'}})
).data;
const urgent = (
  await call('/support', {
    method: 'POST',
    token: user,
    body: {subject: 'Cannot sign in', message: 'Codes do not arrive', priority: 'high'},
  })
).data;
check('a ticket keeps its priority', urgent?.priority === 'high' && tk?.priority === 'medium');
const openQueue = (await call('/support/staff/queue?status=open', {token: boss})).data ?? [];
check(
  'high priority comes first in the queue',
  openQueue.findIndex((t) => t._id === urgent?._id) < openQueue.findIndex((t) => t._id === tk?._id),
);
const legalTickets = (await call('/support/staff/queue?status=open&product=legal', {token: boss})).data ?? [];
check('tickets filter by product', legalTickets.length > 0 && legalTickets.every((t) => t.product === 'legal'));
check(
  'account tickets filter',
  ((await call('/support/staff/queue?status=open&product=none', {token: boss})).data ?? [{product: 'x'}]).every(
    (t) => !t.product,
  ),
);
const legalOrders = (await call('/orders/staff/queue?status=pending_payment&product=legal', {token: boss})).data;
check('orders filter by product', Array.isArray(legalOrders) && legalOrders.every((o) => o.product === 'legal'));
const byNumber = (await call(`/support/staff/queue?q=${urgent?.ticketNo}`, {token: boss})).data ?? [];
check('find a ticket by number', byNumber.length === 1 && byNumber[0]._id === urgent?._id);
check(
  'find tickets by subject words',
  ((await call('/support/staff/queue?q=cannot%20sign', {token: boss})).data ?? []).some((t) => t._id === urgent?._id),
);
check(
  'search is not a regex',
  (await call('/support/staff/queue?q=.*', {token: boss})).data?.every((t) => /\.\*/.test(t.subject + t.email)),
);
const supAgain = (await loginWithCookie(supUser.email)).token;
const supMe = (await call('/auth/me', {token: supAgain})).data;
const withNote = (
  await call(`/support/${tk._id}/notes`, {method: 'POST', token: boss, body: {body: 'Call back Monday'}})
).data;
check('team note', withNote?.notes?.at(-1)?.body === 'Call back Monday');
check('customer never sees notes', (await call(`/support/${tk._id}`, {token: user})).data?.notes === undefined);
check(
  'customer list hides notes too',
  ((await call('/support', {token: user})).data ?? []).every((t) => t.notes === undefined),
);
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
// Two clicks at once: the database lets only one request through, and only one amount is held.
const twin = await Promise.all(
  [1, 2].map(() => call('/wallet/withdrawals', {method: 'POST', token: user, body: {amount: 100, upi: 'test@upi'}})),
);
check(
  'a double click opens one withdrawal',
  twin.filter((r) => r.status === 201).length === 1 &&
    twin.filter((r) => r.status === 409).length === 1 &&
    (await call('/wallet', {token: user})).data.balance === before + 15000,
  twin.map((r) => r.status),
);
const wd2 = twin.find((r) => r.status === 201).data;
const paid = (
  await call(`/wallet/staff/withdrawals/${wd2._id}`, {
    method: 'PATCH',
    token: boss,
    body: {decision: 'paid', utr: 'UTR123'},
  })
).data;
check('paid withdrawal', paid?.status === 'paid' && paid.utr === 'UTR123');

// Card/UPI top-ups. The amount is the server's; the money lands once, whether the browser's callback or the
// webhook (or both, or twice) reports it.
if (RZP) {
  const rzpSign = (secret, data) => crypto.createHmac('sha256', secret).update(data).digest('hex');
  const rzpHook = (entity) => {
    const raw = JSON.stringify({event: 'payment.captured', payload: {payment: {entity}}});
    return fetch(B + '/wallet/topup/razorpay/webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-razorpay-signature': rzpSign(process.env.RAZORPAY_WEBHOOK_SECRET, raw),
      },
      body: raw,
    }).then((r) => r.status);
  };
  const topper = await login(`top${Date.now()}@example.com`);
  const bal = async () => (await call('/wallet', {token: topper})).data.balance;
  check('card top-up is offered', Boolean((await call('/wallet/topup/config', {token: topper})).data?.razorpayKeyId));
  check(
    'a top-up under ₹1 is refused',
    (await call('/wallet/topup/razorpay', {method: 'POST', token: topper, body: {amount: 0.5}})).status === 400,
  );
  const opened = (await call('/wallet/topup/razorpay', {method: 'POST', token: topper, body: {amount: 250}})).data;
  check(
    'a top-up opens for the asked amount',
    opened?.amount === 25000 && /^order_/.test(opened.razorpayOrderId),
    opened,
  );
  const paid = {razorpay_order_id: opened?.razorpayOrderId, razorpay_payment_id: 'pay_top1'};
  const signed = {...paid, razorpay_signature: rzpSign(RZP, `${paid.razorpay_order_id}|${paid.razorpay_payment_id}`)};
  check(
    'a forged signature credits nothing',
    (
      await call('/wallet/topup/razorpay/verify', {
        method: 'POST',
        token: topper,
        body: {...paid, razorpay_signature: 'x'},
      })
    ).status === 400 && (await bal()) === 0,
  );
  check(
    "someone else's top-up cannot be claimed",
    (await call('/wallet/topup/razorpay/verify', {method: 'POST', token: user, body: signed})).status === 400,
  );
  const entity = {id: 'pay_top1', order_id: opened?.razorpayOrderId, amount: 25000};
  check(
    'a webhook for another amount is ignored',
    (await rzpHook({...entity, amount: 99})) === 200 && (await bal()) === 0,
  );
  const [cb1, cb2, h1, h2] = await Promise.all([
    call('/wallet/topup/razorpay/verify', {method: 'POST', token: topper, body: signed}),
    call('/wallet/topup/razorpay/verify', {method: 'POST', token: topper, body: signed}),
    rzpHook(entity),
    rzpHook(entity),
  ]);
  const credits = (await call('/wallet', {token: topper})).data.transactions.filter((t) => /card or UPI/.test(t.note));
  check(
    'callback and webhook together credit once',
    cb1.status === 200 &&
      cb2.status === 200 &&
      h1 === 200 &&
      h2 === 200 &&
      (await bal()) === 25000 &&
      credits.length === 1,
    {cb1: cb1.status, cb2: cb2.status, h1, h2, b: await bal(), n: credits.length},
  );
}

// Card/UPI refunds: a cancelled card order is refunded through Razorpay once, a failed refund can be sent again,
// and a payment that lands on a settled order is refunded by itself.
if (RZP) {
  const RX = process.env.RAZORPAY_URL;
  // Payment ids are unique in Razorpay; these are too, so a rerun against the same stand-in starts clean.
  const [card1, card2] = [1, 2].map((n) => `pay_card${n}_${Date.now()}`);
  const sign = (secret, data) => crypto.createHmac('sha256', secret).update(data).digest('hex');
  const refundsMade = async () => (await (await fetch(RX + '/__count')).json()).refunds;
  const payHook = (event, payload) => {
    const raw = JSON.stringify({event, payload});
    return fetch(B + '/orders/payments/razorpay/webhook', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-razorpay-signature': sign(process.env.RAZORPAY_WEBHOOK_SECRET, raw),
      },
      body: raw,
    }).then((r) => r.status);
  };
  const read = async (id) => (await call(`/orders/${id}`, {token: user})).data;
  const co = (await call('/orders', {method: 'POST', token: user, body: {serviceSlug: 'gst-registration', intake}}))
    .data;
  const opened = (await call(`/orders/${co._id}/pay/razorpay`, {method: 'POST', token: user})).data;
  const pay = {razorpay_order_id: opened?.razorpayOrderId, razorpay_payment_id: card1};
  const paid = await call(`/orders/${co._id}/pay/razorpay/verify`, {
    method: 'POST',
    token: user,
    body: {...pay, razorpay_signature: sign(RZP, `${pay.razorpay_order_id}|${card1}`)},
  });
  check('a card payment pays the order', paid.data?.status === 'paid', paid);
  const before = await refundsMade();
  const cancel = () =>
    call(`/orders/staff/${co._id}`, {method: 'PATCH', token: boss, body: {status: 'cancelled', note: ''}});
  const clicks = await Promise.all([cancel(), cancel()]);
  let now = await read(co._id);
  check(
    'a cancelled card order is refunded once',
    clicks.some((r) => r.status === 200) &&
      now?.status === 'cancelled' &&
      now.payment.refunded &&
      /^rfnd_/.test(now.payment.refundId ?? '') &&
      (await refundsMade()) === before + 1 &&
      now.timeline.filter((t) => /card or UPI/.test(t.note ?? '')).length === 1,
    {clicks: clicks.map((r) => r.status), payment: now?.payment},
  );

  await fetch(RX + '/__unrefund', {method: 'POST', body: JSON.stringify({payment: card1})});
  await payHook('refund.failed', {
    refund: {entity: {id: now?.payment.refundId, payment_id: card1, status: 'failed'}},
  });
  now = await read(co._id);
  check(
    'a failed refund shows money owed again',
    now?.payment.refunded === false && now.payment.refundTries === 1,
    now?.payment,
  );
  const retry = await cancel();
  now = await read(co._id);
  check(
    'retry sends a fresh refund',
    retry.status === 200 && now?.payment.refunded && (await refundsMade()) === before + 2,
    {retry: retry.status, payment: now?.payment},
  );

  const extra = {id: card2, order_id: opened?.razorpayOrderId, amount: co.amount};
  await Promise.all([
    payHook('payment.captured', {payment: {entity: extra}}),
    payHook('payment.captured', {payment: {entity: extra}}),
  ]);
  now = await read(co._id);
  check(
    'a payment on a settled order is refunded by itself, once',
    now?.payment.extraRefunded?.length === 1 &&
      now.payment.extraRefunded[0] === card2 &&
      (await refundsMade()) === before + 3,
    now?.payment,
  );
}

// Withdrawals through RazorpayX. Runs when the stack points at a payout API (the local fake in tests):
// RAZORPAYX_URL, RAZORPAYX_WEBHOOK_SECRET set for both the stack and this script.
if (process.env.RAZORPAYX_WEBHOOK_SECRET) {
  const X = process.env.RAZORPAYX_URL;
  const balance = async () => (await call('/wallet', {token: user})).data.balance;
  const hook = (event, entity, secret = process.env.RAZORPAYX_WEBHOOK_SECRET) => {
    const raw = JSON.stringify({entity: 'event', event, contains: ['payout'], payload: {payout: {entity}}});
    const sig = crypto.createHmac('sha256', secret).update(raw).digest('hex');
    return fetch(B + '/wallet/payouts/razorpayx/webhook', {
      method: 'POST',
      headers: {'content-type': 'application/json', 'x-razorpay-signature': sig},
      body: raw,
    }).then((r) => r.status);
  };
  const ask = async (upi) =>
    (await call('/wallet/withdrawals', {method: 'POST', token: user, body: {amount: 100, upi}})).data;
  const payout = (id) => call(`/wallet/staff/withdrawals/${id}/payout`, {method: 'POST', token: boss});
  check('payouts are switched on', (await call('/wallet/staff/payouts/config', {token: boss})).data?.enabled === true);
  check('support cannot send payouts', (await call('/wallet/staff/payouts/config', {token: supAgain})).status === 403);

  // Sent once, however many clicks.
  await call('/wallet/staff/adjust', {
    method: 'POST',
    token: boss,
    body: {userId: userMe._id, type: 'credit', amount: 1000, reason: 'Payout tests'},
  });
  const start = await balance();
  const p1 = await ask('asha@upi');
  const countBefore = (await (await fetch(X + '/__count')).json()).payouts;
  const clicks = await Promise.all([payout(p1._id), payout(p1._id)]);
  const sent = clicks.find((r) => r.status === 200)?.data;
  check(
    'two clicks send one payout',
    clicks.filter((r) => r.status === 200).length === 1 &&
      clicks.filter((r) => r.status === 409).length === 1 &&
      sent?.status === 'processing' &&
      sent.payout?.id &&
      (await (await fetch(X + '/__count')).json()).payouts === countBefore + 1,
    clicks.map((r) => r.status),
  );
  check(
    'a sending withdrawal still blocks a second one',
    (await call('/wallet/withdrawals', {method: 'POST', token: user, body: {amount: 100, upi: 'other@upi'}})).status ===
      409,
  );
  check(
    'check again changes nothing while processing',
    (await call(`/wallet/staff/withdrawals/${p1._id}/check`, {method: 'POST', token: boss})).data?.status ===
      'processing',
  );
  check(
    'an unsigned webhook is refused',
    (await hook('payout.processed', {id: sent?.payout?.id, status: 'processed'}, 'wrong')) === 400,
  );
  const processed = {id: sent?.payout?.id, status: 'processed', amount: 10000, utr: 'RZPX-UTR-1', reference_id: p1._id};
  check('a signed webhook is taken', (await hook('payout.processed', processed)) === 200);
  await hook('payout.processed', processed); // RazorpayX may send it twice
  const p1After = (await call('/wallet/withdrawals', {token: user})).data?.find((x) => x._id === p1._id);
  check(
    'processed webhook pays it, once',
    p1After?.status === 'paid' && p1After.utr === 'RZPX-UTR-1' && (await balance()) === start - 10000,
  );

  // A clear refusal: nothing was sent, so it goes back to finance, money still held.
  const p2 = await ask('refuse@upi');
  const refused = (await payout(p2._id)).data;
  check(
    'a refused payout goes back to "to pay"',
    refused?.status === 'requested' && /Invalid VPA/.test(refused.payout?.error ?? ''),
    refused,
  );
  await call(`/wallet/staff/withdrawals/${p2._id}`, {
    method: 'PATCH',
    token: boss,
    body: {decision: 'rejected', reason: 'UPI ID refused'},
  });
  check('then rejected by hand, the money returns', (await balance()) === start - 10000);

  // A reversal returns the money exactly once, even when two webhooks race.
  const p3 = await ask('ravi@upi');
  const p3sent = (await payout(p3._id)).data;
  const reversed = {
    id: p3sent?.payout?.id,
    status: 'reversed',
    amount: 10000,
    reference_id: p3._id,
    status_details: {description: 'Beneficiary bank down'},
  };
  await Promise.all([hook('payout.reversed', reversed), hook('payout.reversed', reversed)]);
  const p3After = (await call('/wallet/withdrawals', {token: user})).data?.find((x) => x._id === p3._id);
  check(
    'a reversed payout returns the money once',
    p3After?.status === 'rejected' && /bank down/.test(p3After.reason) && (await balance()) === start - 10000,
    {p3After, b: await balance()},
  );
  check(
    'a webhook for another amount is ignored',
    (await hook('payout.processed', {...processed, id: 'pout_x', amount: 1})) === 200,
  );

  // A lost webhook: "check again" reads the payout and finishes it.
  const p4 = await ask('meera@upi');
  const p4sent = (await payout(p4._id)).data;
  await fetch(X + '/__set', {
    method: 'POST',
    headers: {'content-type': 'application/json'},
    body: JSON.stringify({id: p4sent?.payout?.id, status: 'processed', utr: 'RZPX-UTR-4'}),
  });
  const p4After = (await call(`/wallet/staff/withdrawals/${p4._id}/check`, {method: 'POST', token: boss})).data;
  check(
    'check again settles a payout whose webhook never came',
    p4After?.status === 'paid' && p4After.utr === 'RZPX-UTR-4',
  );
}

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

// ── Admin: openings and the internship pipeline ─────────────────────────
const op = (
  await call('/learning/staff/openings', {
    method: 'POST',
    token: boss,
    body: {
      title: 'Design intern',
      kind: 'internship',
      mode: 'remote',
      weeks: 8,
      description: 'Help design the Pirento sites for three months.',
    },
  })
).data;
check('post opening', Boolean(op?._id), op);
check(
  'openings are public',
  (await call('/learning/openings')).data?.some((o) => o._id === op._id),
);
const applyBody = {fullName: 'Asha Verma', note: 'I design', links: 'https://example.com/asha'};
check(
  'apply needs a resume',
  (await call(`/learning/openings/${op._id}/apply`, {method: 'POST', token: user, body: applyBody})).status === 400,
);
const sendResume = (name) =>
  fetch(`${B}/learning/resume`, {
    method: 'POST',
    headers: {authorization: `Bearer ${user}`, 'content-type': 'application/octet-stream', 'x-file-name': name},
    body: Buffer.from('%PDF-1.4 test resume'),
  });
check('resume must be PDF or Word', (await sendResume('cv.exe')).status === 400);
check('resume upload', (await sendResume('cv.pdf')).status === 200);
check(
  'apply',
  (await call(`/learning/openings/${op._id}/apply`, {method: 'POST', token: user, body: applyBody})).status === 201,
);
check(
  'apply once',
  (await call(`/learning/openings/${op._id}/apply`, {method: 'POST', token: user, body: applyBody})).status === 409,
);
const app = (await call(`/learning/staff/applications?openingId=${op._id}`, {token: boss})).data?.[0];
check('staff queue lists the applicant with a resume', app?.hasResume && app.opening?.title === 'Design intern', app);
const resumeBack = await fetch(`${B}/learning/staff/applications/${app._id}/resume`, {
  headers: {authorization: `Bearer ${boss}`},
});
check('staff download the resume', (await resumeBack.text()).startsWith('%PDF'));
const move = (to, extra = {}, base = '/learning/staff/applications', token = boss) =>
  call(`${base}/${app._id}/move`, {method: 'POST', token, body: {to, ...extra}});
check('cannot skip to completed', (await move('completed')).status === 409);
check('shortlist', (await move('shortlisted')).data?.status === 'shortlisted');
check('interview needs a time', (await move('interview')).status === 409);
check(
  'interview set',
  (
    await move('interview', {
      interview: {at: new Date(Date.now() + 86_400_000).toISOString(), link: 'https://meet.example.com/x'},
    })
  ).data?.status === 'interview',
);
check(
  'offer made',
  (await move('offered', {offer: {start: '2026-12-01', weeks: 8, stipend: '₹10,000 a month'}})).data?.status ===
    'offered',
);
check('the team cannot accept for them', (await move('accepted')).status === 400);
const answer = (accept) =>
  call(`/learning/applications/${app._id}/answer`, {method: 'POST', token: user, body: {accept}});
check('applicant accepts', (await answer(true)).data?.status === 'accepted');
check('an offer is answered once', (await answer(false)).status === 409);
check('completing needs approved tasks', (await move('completed')).status === 409);
const task = (
  await call(`/learning/staff/applications/${app._id}/tasks`, {
    method: 'POST',
    token: boss,
    body: {title: 'Design a landing page'},
  })
).data?.tasks?.[0];
check('task set', task?.status === 'open', task);
const review = (status) =>
  call(`/learning/staff/applications/${app._id}/tasks/${task._id}`, {method: 'PATCH', token: boss, body: {status}});
check('nothing to review before it is sent', (await review('approved')).status === 409);
const sendTask = (token) =>
  call(`/learning/applications/${app._id}/tasks/${task._id}`, {
    method: 'POST',
    token,
    body: {answer: 'Done', link: 'https://example.com/design'},
  });
check('only the intern sends their task', (await sendTask(boss)).status === 409);
check('intern sends the task', (await sendTask(user)).data?.tasks?.[0]?.status === 'submitted');
check('task approved', (await review('approved')).data?.tasks?.[0]?.status === 'approved');
const finished = (await move('completed')).data;
check(
  'internship completes with a certificate',
  finished?.status === 'completed' && /^PC-/.test(finished.certificateCode ?? ''),
  finished,
);
const ic = (await call(`/learning/verify/${finished.certificateCode}`)).data;
check(
  'internship certificate verifies',
  ic?.kind === 'internship' && ic.trackName === 'Design intern' && ic.fullName === 'Asha Verma' && ic.weeks === 8,
  ic,
);
check(
  'applicant sees it completed',
  (await call('/learning/applications/mine', {token: user})).data?.find((a) => a._id === app._id)?.status ===
    'completed',
);
await call(`/learning/staff/openings/${op._id}`, {method: 'PATCH', token: boss, body: {open: false}});
check('closed opening hidden', !(await call('/learning/openings')).data?.some((o) => o._id === op._id));

// ── Intern companies ────────────────────────────────────────────────────
const co = await login(`co${Date.now()}@example.com`);
check('company area needs approval', (await call('/learning/employer/openings', {token: co})).status === 403);
const coBody = {
  company: 'Acme Labs',
  website: 'https://acme.example.com',
  about: 'We build simple tools for small shops across India.',
  contactName: 'Meera Rao',
  phone: '9876512345',
};
check('company asks', (await call('/learning/employers', {method: 'POST', token: co, body: coBody})).status === 201);
check(
  'company asks once',
  (await call('/learning/employers', {method: 'POST', token: co, body: coBody})).status === 409,
);
check(
  'staff cannot run a company',
  (await call('/learning/employers', {method: 'POST', token: boss, body: coBody})).status === 403,
);
const acme = (await call('/learning/staff/employers?status=requested', {token: boss})).data?.find((e) =>
  e.email.startsWith('co'),
);
check(
  'staff approve the company',
  (await call(`/learning/staff/employers/${acme._id}`, {method: 'PATCH', token: boss, body: {status: 'approved'}})).data
    ?.status === 'approved',
);
const cop = (
  await call('/learning/employer/openings', {
    method: 'POST',
    token: co,
    body: {
      title: 'Support intern',
      kind: 'internship',
      mode: 'onsite',
      description: 'Answer shop owners and log what they need.',
    },
  })
).data;
check('company opening waits for review', cop?.open === false && cop.review === 'pending', cop);
check('not public before review', !(await call('/learning/openings')).data?.some((o) => o._id === cop._id));
check(
  'company cannot open it before review',
  (await call(`/learning/employer/openings/${cop._id}`, {method: 'PATCH', token: co, body: {open: true}})).status ===
    409,
);
await call(`/learning/staff/openings/${cop._id}`, {method: 'PATCH', token: boss, body: {review: 'approved'}});
check(
  'approved company opening is public',
  (await call('/learning/openings')).data?.find((o) => o._id === cop._id)?.company === 'Acme Labs',
);
await call(`/learning/openings/${cop._id}/apply`, {method: 'POST', token: user, body: applyBody});
const coApps = (await call('/learning/employer/applications', {token: co})).data;
check(
  'company sees only its applicants',
  coApps?.length === 1 && coApps[0].opening?.title === 'Support intern',
  coApps,
);
check(
  'company shortlists',
  (
    await call(`/learning/employer/applications/${coApps[0]._id}/move`, {
      method: 'POST',
      token: co,
      body: {to: 'shortlisted'},
    })
  ).data?.status === 'shortlisted',
);
check(
  'company cannot touch others',
  (await move('declined', {}, '/learning/employer/applications', co)).status === 404,
);
await call(`/learning/staff/employers/${acme._id}`, {method: 'PATCH', token: boss, body: {status: 'suspended'}});
check(
  'pausing a company closes its openings',
  !(await call('/learning/openings')).data?.some((o) => o._id === cop._id),
);
check('a paused company is locked out', (await call('/learning/employer/applications', {token: co})).status === 403);

// ── Intern courses: tracks, question bank, lessons ──────────────────────
const slug = `qa-${Date.now() % 1_000_000}`;
const trackBody = {name: 'QA testing', minutes: 20, passPercent: 50, questions: 3, active: true};
check(
  'customers cannot edit courses',
  (await call(`/learning/staff/courses/tracks/${slug}`, {method: 'PUT', token: user, body: trackBody})).status === 403,
);
await call(`/learning/staff/courses/tracks/${slug}`, {method: 'PUT', token: boss, body: trackBody});
check(
  'answer must be an option',
  (
    await call('/learning/staff/courses/questions', {
      method: 'POST',
      token: boss,
      body: {track: slug, skill: 'practical', question: 'Which one is right here?', options: ['a', 'b'], answer: 3},
    })
  ).status === 400,
);
const answers = {};
for (let i = 0; i < 4; i++) {
  const q = (
    await call('/learning/staff/courses/questions', {
      method: 'POST',
      token: boss,
      body: {
        track: slug,
        skill: 'theoretical',
        question: `Test question number ${i}?`,
        options: ['no', 'yes', 'maybe'],
        answer: 1,
      },
    })
  ).data;
  answers[q._id] = q.answer;
}
check('new track is public', (await call('/learning/tracks')).data?.find((t) => t.slug === slug)?.minutes === 20);
const qa = (
  await call('/learning/exam/start', {method: 'POST', token: user, body: {track: slug, fullName: 'Asha Verma'}})
).data;
check(
  'exam draws the track count with its time',
  qa?.questions?.length === 3 && Math.abs(new Date(qa.endsAt) - Date.now() - 20 * 60_000) < 60_000,
  qa,
);
const qaDone = (await call(`/learning/exam/${qa.id}/submit`, {method: 'POST', token: user, body: {answers}})).data;
check('admin questions score', qaDone?.passed && qaDone.certificate?.trackName === 'QA testing', qaDone);
const lesson = (
  await call('/learning/staff/courses/lessons', {
    method: 'POST',
    token: boss,
    body: {
      track: slug,
      order: 1,
      title: 'What a test is',
      body: 'A test checks that the software does what it should, every time.',
      practice: [{question: 'A test checks…', options: ['behaviour', 'colours'], answer: 0, explain: 'Behaviour.'}],
      published: true,
    },
  })
).data;
const lessonRow = (await call(`/learning/lessons?track=${slug}`)).data?.[0];
check('published lesson lessonRow without its body', lessonRow?.practice === 1 && !('body' in lessonRow), lessonRow);
const readLesson = (await call(`/learning/lessons/${lesson._id}`)).data;
check('lesson hides practice answers', readLesson?.body && !('answer' in readLesson.practice[0]), readLesson);
const tryLesson = (a) =>
  call(`/learning/lessons/${lesson._id}/check`, {method: 'POST', token: user, body: {answers: [a]}});
check('wrong practice is not done', (await tryLesson(1)).data?.done === false);
check('right practice finishes the lesson', (await tryLesson(0)).data?.done === true);
check(
  'progress kept',
  (await call('/learning/lessons/progress', {token: user})).data?.some((p) => p.lessonId === lesson._id),
);
const draftLesson = (
  await call('/learning/staff/courses/lessons', {
    method: 'POST',
    token: boss,
    body: {
      track: slug,
      order: 2,
      title: 'Draft lesson',
      body: 'Not ready yet, still being written.',
      practice: [],
      published: false,
    },
  })
).data;
check('draft lessons stay hidden', (await call(`/learning/lessons/${draftLesson._id}`)).status === 404);
await call(`/learning/staff/courses/tracks/${slug}`, {method: 'PUT', token: boss, body: {...trackBody, active: false}});
check(
  'a switched-off track takes no exams',
  (await call('/learning/exam/start', {method: 'POST', token: user, body: {track: slug, fullName: 'Asha Verma'}}))
    .status === 404,
);

// ── Intern programme: places, AI-set tasks, live classes, paid work ─────
check('programmes are listed', (await call('/learning/programs')).data?.length === 4);
check(
  'only a superadmin sets a programme price',
  (await call('/learning/staff/program/programs/3', {method: 'PUT', token: user, body: {price: 50000, active: true}}))
    .status === 403,
);
await call('/learning/staff/program/programs/3', {method: 'PUT', token: boss, body: {price: 50000, active: true}});
check('price shows', (await call('/learning/programs')).data?.find((p) => p.months === 3)?.price === 50000);
check(
  'a place needs a Bharat ID',
  (await call('/learning/program/buy', {method: 'POST', token: co, body: {months: 3}})).error?.code ===
    'NEEDS_BHARAT_ID',
);
const progWalletBefore = (await call('/wallet', {token: user})).data.balance;
const progPlace = (await call('/learning/program/buy', {method: 'POST', token: user, body: {months: 3}})).data;
check('buy a place from the wallet', progPlace?.status === 'active' && progPlace.paid === 50000, progPlace);
check('paid once', (await call('/wallet', {token: user})).data.balance === progWalletBefore - 50000);
check(
  'one running place',
  (await call('/learning/program/buy', {method: 'POST', token: user, body: {months: 3}})).status === 409,
);
let progMe = (await call('/learning/program/me', {token: user})).data;
check(
  'paid work waits for a profile',
  !progMe?.eligible && progMe.checks.bharatId && progMe.checks.certified && !progMe.checks.profile,
  progMe,
);
check('tasks wait for a profile', (await call('/learning/program/tasks', {token: user})).status === 409);
await call('/learning/program/profile', {
  method: 'PUT',
  token: user,
  body: {fullName: 'Asha Verma', track: 'web-development', skills: ['html', 'css']},
});
progMe = (await call('/learning/program/me', {token: user})).data;
check('eligible for paid work', progMe?.eligible === true, progMe);
const progTasks = (await call('/learning/program/tasks', {token: user})).data;
check(
  'daily, weekly and monthly tasks are written',
  progTasks?.current?.map((t) => t.cadence).join() === 'daily,weekly,monthly' &&
    progTasks.current.every((t) => t.by !== 'pending'),
  progTasks,
);
check(
  'the same progTasks come back',
  (await call('/learning/program/tasks', {token: user})).data?.current?.[0]?._id === progTasks.current[0]._id,
);
const dailyTask = progTasks.current[0];
const sendDaily = () =>
  call(`/learning/program/tasks/${dailyTask._id}/submit`, {
    method: 'POST',
    token: user,
    body: {answer: 'I built a page.'},
  });
check('send a task', ['submitted', 'graded'].includes((await sendDaily()).data?.status));
check('a task is sent once', (await sendDaily()).status === 409);
check(
  'staff grade a task',
  (await call(`/learning/staff/program/tasks/${dailyTask._id}`, {method: 'PATCH', token: boss, body: {grade: 80}})).data
    ?.status === 'graded',
);
const liveNow = (
  await call('/learning/staff/program/classes', {
    method: 'POST',
    token: boss,
    body: {
      title: 'Intro to the web',
      startsAt: new Date().toISOString(),
      minutes: 60,
      link: 'https://meet.example.com/abc',
    },
  })
).data;
const laterClass = (
  await call('/learning/staff/program/classes', {
    method: 'POST',
    token: boss,
    body: {
      title: 'CSS layout',
      startsAt: new Date(Date.now() + 86_400_000).toISOString(),
      minutes: 60,
      link: 'https://meet.example.com/def',
    },
  })
).data;
const myClasses = (await call('/learning/classes', {token: user})).data;
check(
  'classes listed without their links',
  myClasses?.some((c) => c._id === liveNow._id) && !myClasses.some((c) => c.link),
);
check('classes need a place', (await call('/learning/classes', {token: co})).status === 403);
check(
  'join a running class',
  (await call(`/learning/classes/${liveNow._id}/join`, {method: 'POST', token: user})).data?.link ===
    'https://meet.example.com/abc',
);
check(
  'a future class is not open yet',
  (await call(`/learning/classes/${laterClass._id}/join`, {method: 'POST', token: user})).status === 409,
);
check(
  'attendance kept',
  (await call('/learning/classes', {token: user})).data?.find((c) => c._id === liveNow._id)?.attended === true,
);
check(
  'video storage says when it is not set up',
  (await call('/learning/staff/program/video-ready', {token: boss})).data?.ready === false &&
    (
      await call(`/learning/staff/program/classes/${liveNow._id}/recording`, {
        method: 'POST',
        token: boss,
        body: {name: 'class.mp4', type: 'video/mp4', size: 1000},
      })
    ).status === 503,
);
const paidJob = (
  await call('/learning/staff/program/work', {
    method: 'POST',
    token: boss,
    body: {
      title: 'Build the Foundation donors page',
      brief: 'A simple page listing the Foundation drives with their dates.',
      source: 'Pirento Foundation',
      track: 'web-development',
      skills: ['html'],
      pay: 20000,
    },
  })
).data;
const paidSug = (await call(`/learning/staff/program/work/${paidJob._id}/suggest`, {method: 'POST', token: boss})).data;
check('a suggestion with its reason', Boolean(paidSug?.suggestion?.userId && paidSug.suggestion.reason), paidSug);
check(
  'only eligible interns get paid work',
  (
    await call(`/learning/staff/program/work/${paidJob._id}/assign`, {
      method: 'POST',
      token: boss,
      body: {userId: 'nobody'},
    })
  ).status === 409,
);
check(
  'assign',
  (
    await call(`/learning/staff/program/work/${paidJob._id}/assign`, {
      method: 'POST',
      token: boss,
      body: {userId: progMe.enrolment.userId},
    })
  ).data?.status === 'assigned',
);
check(
  'the intern sees their work',
  (await call('/learning/work/mine', {token: user})).data?.some((x) => x._id === paidJob._id),
);
check(
  'a javascript: link is refused',
  (
    await call(`/learning/work/${paidJob._id}/submit`, {
      method: 'POST',
      token: user,
      body: {answer: 'Done', link: 'javascript:alert(1)'},
    })
  ).status === 400,
);
check(
  'intern sends the work',
  (
    await call(`/learning/work/${paidJob._id}/submit`, {
      method: 'POST',
      token: user,
      body: {answer: 'Done', link: 'https://example.com/donors'},
    })
  ).data?.status === 'submitted',
);
const progBeforePay = (await call('/wallet', {token: user})).data.balance;
const approvedJob = (
  await call(`/learning/staff/program/work/${paidJob._id}/review`, {
    method: 'PATCH',
    token: boss,
    body: {status: 'approved', grade: 90},
  })
).data;
check(
  'approval pays the wallet once',
  approvedJob?.paid && (await call('/wallet', {token: user})).data.balance === progBeforePay + 20000,
  approvedJob,
);
check(
  'nothing more to pay',
  (await call(`/learning/staff/program/work/${paidJob._id}/pay`, {method: 'POST', token: boss})).status === 404,
);
check(
  'resume draft needs the AI',
  (await call('/learning/program/resume', {method: 'POST', token: user})).status === 503,
);
const progEnded = (
  await call(`/learning/staff/program/enrolments/${progPlace._id}/finish`, {method: 'POST', token: boss})
).data;
check(
  'finishing fixes the mark and issues the certificate',
  progEnded?.status === 'finished' &&
    progEnded.score.work === 90 &&
    progEnded.score.tasks === 80 &&
    /^PC-/.test(progEnded.certificateCode ?? ''),
  progEnded,
);
const progCert = (await call(`/learning/verify/${progEnded.certificateCode}`)).data;
check(
  'programme certificate verifies',
  progCert?.kind === 'program' && progCert.percent === progEnded.score.total,
  progCert,
);
check(
  'a finished progPlace is not finished twice',
  (await call('/learning/program/finish', {method: 'POST', token: user})).status === 404,
);

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
check('reset removes the price change', !(await call('/catalog/prices')).data?.['gst-registration']?.price);
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
const usesOf = async () =>
  (await call('/orders/staff/coupons', {token: boss})).data?.find((c) => c._id === cp2._id)?.uses;
check('an unpaid order does not use the code up', (await usesOf()) === 0);
await call(`/orders/${o2._id}/cancel`, {method: 'POST', token: user});
const o3 = (
  await call('/orders', {method: 'POST', token: user, body: {serviceSlug: 'gst-registration', coupon: code2, intake}})
).data;
await call('/wallet/staff/adjust', {
  method: 'POST',
  token: boss,
  body: {
    userId: (await call('/auth/me', {token: user})).data._id,
    type: 'credit',
    amount: o3.amount / 100,
    reason: 'Test',
  },
});
await call(`/orders/${o3._id}/pay/wallet`, {method: 'POST', token: user});
check('paying counts the code', (await usesOf()) === 1);
check(
  'a used-up code is refused',
  (await call('/orders', {method: 'POST', token: user, body: {serviceSlug: 'gst-registration', coupon: code2, intake}}))
    .error?.code === 'COUPON',
);

// A code with one use left, on two unpaid orders paid at the same moment: one pays, one is refused, no overshoot.
const code3 = `LAST${Date.now().toString().slice(-6)}`;
const cp3 = (
  await call('/orders/staff/coupons', {
    method: 'POST',
    token: boss,
    body: {code: code3, kind: 'flat', value: 100, maxUses: 1},
  })
).data;
const placeWith = async () =>
  (await call('/orders', {method: 'POST', token: user, body: {serviceSlug: 'gst-registration', coupon: code3, intake}}))
    .data;
const [oa, ob] = [await placeWith(), await placeWith()];
await call('/wallet/staff/adjust', {
  method: 'POST',
  token: boss,
  body: {
    userId: (await call('/auth/me', {token: user})).data._id,
    type: 'credit',
    amount: (oa.amount + ob.amount) / 100,
    reason: 'Test',
  },
});
const walletBefore = (await call('/wallet', {token: user})).data.balance;
const both = await Promise.all([oa, ob].map((o) => call(`/orders/${o._id}/pay/wallet`, {method: 'POST', token: user})));
const uses3 = (await call('/orders/staff/coupons', {token: boss})).data?.find((c) => c._id === cp3._id)?.uses;
check(
  'a code with one use left pays one order, not two',
  both.filter((r) => r.status === 200).length === 1 &&
    both.find((r) => r.status !== 200)?.error?.code === 'CODE_USED_UP' &&
    uses3 === 1 &&
    (await call('/wallet', {token: user})).data.balance === walletBefore - oa.amount,
  {statuses: both.map((r) => r.status), uses3},
);
check(
  'retrying the paid one does not count the code again',
  (await call(`/orders/${both.find((r) => r.status === 200).data._id}/pay/wallet`, {method: 'POST', token: user}))
    .status === 200 &&
    (await call('/orders/staff/coupons', {token: boss})).data?.find((c) => c._id === cp3._id)?.uses === 1,
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
const asks = await Promise.all(
  [1, 2].map(() => call('/auth/me/deletion', {method: 'POST', token: leaver.token, body: {reason: 'Done'}})),
);
check(
  'ask to delete, once even on a double click',
  asks.filter((r) => r.status === 201).length === 1 && asks.filter((r) => r.status === 409).length === 1,
  asks.map((r) => r.status),
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
// Sign out of every device: both sessions' refresh cookies stop working.
const roamer = `roamer${Date.now()}@example.com`;
const laptop = await loginWithCookie(roamer);
const phone = await loginWithCookie(roamer);
check(
  'sign out everywhere',
  (await call('/auth/logout/everywhere', {method: 'POST', token: laptop.token})).status === 200,
);
check(
  'every device is signed out',
  (await fetch(B + '/auth/refresh', {method: 'POST', headers: {cookie: laptop.cookie}})).status === 401 &&
    (await fetch(B + '/auth/refresh', {method: 'POST', headers: {cookie: phone.cookie}})).status === 401,
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

// ── Admin: a new Legal package, its questions beforeQs and afterQs payment ──
const pack = `Startup pack ${Date.now().toString(36)}`;
const packBody = {
  product: 'legal',
  name: pack,
  category: 'Packages',
  description: 'Company, GST and trademark together.',
  deliveryTime: '20-25 days',
  price: 4999,
  includes: ['Private Limited Company', 'GST Registration'],
};
check(
  'only a superadmin adds a service',
  (await call('/catalog/staff/services', {method: 'POST', token: staffToken, body: packBody})).status === 403,
);
const pkg = (await call('/catalog/staff/services', {method: 'POST', token: boss, body: packBody})).data;
check('a package pkg in admin carries its product in the slug', pkg?.slug?.startsWith('legal-startup-pack'), pkg);
check(
  'the same name twice is refused',
  (await call('/catalog/staff/services', {method: 'POST', token: boss, body: packBody})).status === 409,
);
check(
  'the new package is lessonRow on Legal',
  (await call('/catalog/products/legal')).data?.services?.some((sv) => sv.slug === pkg?.slug && sv.price === 4999),
);
const setQs = (questions, afterQuestions, token = boss) =>
  call(`/catalog/staff/services/${pkg?.slug}/questions`, {method: 'PUT', token, body: {questions, afterQuestions}});
const beforeQs = [
  {id: 'companyName', label: 'Proposed company name', required: true},
  {id: 'plan', label: 'Which plan suits you?', options: ['Basic', 'Full']},
];
const afterQs = [
  {id: 'directors', label: 'Names of the directors', required: true},
  {id: 'office', label: 'Is the office rented?', options: ['Rented', 'Owned']},
];
check(
  'questions may not take checkout’s own ids',
  (await setQs([{id: 'phone', label: 'Phone again'}], null)).status === 400,
);
check(
  'a choice needs two options',
  (await setQs([{id: 'x', label: 'Pick one', options: ['Only']}], null)).status === 400,
);
check('staff cannot set questions', (await setQs(beforeQs, afterQs, staffToken)).status === 403);
check('questions saved', (await setQs(beforeQs, afterQs)).data?.afterQuestions?.length === 2);
const packOrder = (b) => call('/orders', {method: 'POST', token: user, body: {serviceSlug: pkg?.slug, intake: b}});
check(
  'checkout asks the new questions, not the old ones',
  (await packOrder({phone: '9876500000', plan: 'Full'})).status === 400,
);
const pkgOrder = (await packOrder({phone: '9876500000', companyName: 'Acme Labs', plan: 'Full', state: 'Goa'})).data;
check(
  'the order keeps what it was asked',
  pkgOrder?.amount === 499900 &&
    pkgOrder.intake.companyName === 'Acme Labs' &&
    !pkgOrder.intake.state &&
    pkgOrder.asked?.length === 3,
  pkgOrder,
);
const sendDetails = (answers, token = user) =>
  call(`/orders/${pkgOrder?._id}/details`, {method: 'PUT', token, body: {answers}});
check('no sendDetails beforeQs payment', (await sendDetails({directors: 'A, B', office: 'Rented'})).status === 409);
await call('/wallet/topup', {method: 'POST', token: user, body: {amount: 4999}});
await call(`/orders/${pkgOrder?._id}/pay/wallet`, {method: 'POST', token: user});
check('a missing answer is refused', (await sendDetails({office: 'Rented'})).status === 400);
check(
  'someone else cannot answer',
  (await sendDetails({directors: 'X', office: 'Rented'}, await login(`y${Date.now()}@example.com`))).status === 404,
);
const answeredPkg = (await sendDetails({directors: 'Asha Rao, Vikram Shah', office: 'Rented', evil: 'x'})).data;
check(
  'after-payment answers are kept',
  answeredPkg?.details?.directors === 'Asha Rao, Vikram Shah' && !answeredPkg.details.evil && answeredPkg.detailsAt,
  answeredPkg,
);
// Later edits to the questions never change an order already placed.
await setQs(null, null);
const keptPkg = (await call(`/orders/${pkgOrder?._id}`, {token: boss})).data;
check(
  'a placed order keeps its questions',
  keptPkg?.afterQuestions?.length === 2 && keptPkg.asked?.length === 3,
  keptPkg,
);
check('back to the standard questions', !(await call('/catalog/services/' + pkg?.slug)).data?.questions);
await call(`/catalog/staff/services/${pkg?.slug}`, {
  method: 'PATCH',
  token: boss,
  body: {...packBody, product: undefined, price: 5499},
});
check('editing a package changes its price', (await call(`/catalog/services/${pkg?.slug}`)).data?.price === 5499);
check(
  'base services cannot be deleted',
  (await call('/catalog/staff/services/gst-registration', {method: 'DELETE', token: boss})).status === 404,
);
await call(`/catalog/staff/services/${pkg?.slug}`, {method: 'DELETE', token: boss});
check('a deleted package takes no orders', (await packOrder({phone: '9876500000'})).error?.code === 'NOT_FOR_SALE');
check('its order stays', (await call(`/orders/${pkgOrder?._id}`, {token: user})).data?.serviceName === pack);

// ── Contact form ────────────────────────────────────────────────────────
const enquiry = {
  name: 'Meera Iyer',
  email: `m${Date.now()}@example.com`,
  phone: '98765 43210',
  product: 'legal',
  service: 'gst-registration',
  message: 'I run a small bakery and need GST. What papers do I need?',
};
const sent = await call('/support/enquiries', {method: 'POST', body: enquiry});
check('anyone can send the contact form', sent.status === 201 && sent.data?.enquiryNo > 0, sent);
check(
  'a short message is refused',
  (await call('/support/enquiries', {method: 'POST', body: {...enquiry, message: 'hi'}})).status === 400,
);
check(
  'a bad phone is refused',
  (await call('/support/enquiries', {method: 'POST', body: {...enquiry, phone: '12345'}})).status === 400,
);
const bot = await call('/support/enquiries', {method: 'POST', body: {...enquiry, website: 'spam.example'}});
check('a bot is told it worked but nothing is kept', bot.status === 201 && !bot.data?.enquiryNo);
check('customers cannot read enquiries', (await call('/support/staff/enquiries', {token: user})).status === 403);
const inbox = (
  await call(`/support/staff/enquiries?product=legal&q=${encodeURIComponent(enquiry.email)}`, {token: boss})
).data;
const mineEnq = inbox?.find((e) => e.enquiryNo === sent.data?.enquiryNo);
check('the superadmin sees it, phone tidied', mineEnq?.phone === '+919876543210' && mineEnq.status === 'new', inbox);
check(
  'the bot’s message is not there',
  !inbox?.some((e) => e.email === enquiry.email && e.enquiryNo !== sent.data?.enquiryNo),
);
const handled = (
  await call(`/support/staff/enquiries/${mineEnq?._id}`, {
    method: 'PATCH',
    token: boss,
    body: {status: 'handled', note: 'Emailed the GST checklist'},
  })
).data;
check('marked handled with a note', handled?.status === 'handled' && handled.handledBy === 'boss@example.com', handled);
check(
  'handled ones leave the new list',
  !(await call('/support/staff/enquiries', {token: boss})).data?.some((e) => e._id === mineEnq?._id),
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
