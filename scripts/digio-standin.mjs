// A stand-in for the outside APIs in local tests and CI, kept in memory: Digio's KYC and sign endpoints (Bharat ID),
// Digio's Account Aggregator under /fiu_api (Vault linked accounts), API Setu's death certificates under /apisetu,
// Blue Dart's gateway under /bluedart (shipments) and Meta's WhatsApp API under /whatsapp, plus /__test routes to
// play the person or the courier, and to read what was sent on WhatsApp.
// Usage: node scripts/digio-standin.mjs (port 4090).
import http from 'node:http';
import crypto from 'node:crypto';

const kycs = new Map();
const consents = new Map(); // Account Aggregator consent requests
const parcels = new Map(); // Blue Dart waybills
const waSent = []; // WhatsApp messages Pirento sent
const docs = new Map();
const byCallback = new Map();
const id = (p) => p + crypto.randomBytes(8).toString('hex').toUpperCase();

const send = (res, code, body, type = 'application/json') => {
  res.writeHead(code, {'content-type': type});
  res.end(type === 'application/json' ? JSON.stringify(body) : body);
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString() || '{}') : {};
  const path = url.pathname;
  const digio = !/^\/(__test|apisetu|bluedart|whatsapp)/.test(path);
  if (digio && !/^Basic .+/.test(req.headers.authorization ?? '')) {
    return send(res, 401, {code: 'UNAUTHORIZED', message: 'No credentials'});
  }

  if (req.method === 'POST' && path === '/client/kyc/v2/request/with_template') {
    if (!body.customer_identifier || !body.template_name) return send(res, 400, {code: 'REQUEST_VALIDATION_FAILED'});
    const k = {id: id('KID'), status: 'requested', file: id('FILE'), ...body};
    kycs.set(k.id, k);
    return send(res, 200, {
      id: k.id,
      status: 'requested',
      customer_identifier: body.customer_identifier,
      access_token: {id: id('GWT')},
    });
  }
  let m = path.match(/^\/client\/kyc\/v2\/([^/]+)\/response$/);
  if (req.method === 'POST' && m) {
    const k = kycs.get(m[1]);
    if (!k) return send(res, 404, {code: 'NOT_FOUND'});
    const done = k.status !== 'requested';
    return send(res, 200, {
      id: k.id,
      status: k.status,
      actions: [{type: 'video', status: done ? 'success' : 'requested', file_id: done ? k.file : undefined}],
    });
  }
  m = path.match(/^\/client\/kyc\/v2\/media\/([^/]+)$/);
  if (req.method === 'GET' && m) return send(res, 200, 'stand-in video bytes', 'video/mp4');

  if (req.method === 'POST' && path === '/v2/client/document/uploadpdf') {
    const pdf = Buffer.from(body.file_data ?? '', 'base64');
    if (!pdf.subarray(0, 5).equals(Buffer.from('%PDF-')) || !body.signers?.length) {
      return send(res, 400, {code: 'REQUEST_VALIDATION_FAILED', message: 'A PDF and a signer are needed'});
    }
    const known = body.callback && byCallback.get(body.callback);
    const d = known ?? {id: id('DID'), agreement_status: 'requested', pdf, estamp: body.estamp_request ?? null};
    docs.set(d.id, d);
    if (body.callback) byCallback.set(body.callback, d);
    return send(res, 200, {id: d.id, agreement_status: d.agreement_status, access_token: {id: id('GWT')}});
  }
  if (req.method === 'GET' && path === '/v2/client/document/download') {
    const d = docs.get(url.searchParams.get('document_id'));
    return d ? send(res, 200, d.pdf, 'application/pdf') : send(res, 404, {code: 'NOT_FOUND'});
  }
  m = path.match(/^\/v2\/client\/document\/([^/]+)$/);
  if (req.method === 'GET' && m) {
    const d = docs.get(m[1]);
    return d ? send(res, 200, {id: d.id, agreement_status: d.agreement_status}) : send(res, 404, {code: 'NOT_FOUND'});
  }

  // Digio's Account Aggregator (FIU-TSP): a consent waits until /__test/aa/:id approves it, then data is ready at once.
  if (req.method === 'POST' && path === '/fiu_api/client/consent/request') {
    if (!body.template_id || !body.customer_details?.customer_mobile) return send(res, 400, {code: 'BAD_REQUEST'});
    const c = {id: id('CRD'), customer: id('CID'), status: 'PENDING', fi: null};
    consents.set(c.id, c);
    return send(res, 200, {
      consent_request_id: c.id,
      gateway_token_id: id('GWT'),
      customer_details: {id: c.customer},
      status: 'PENDING',
    });
  }
  m = path.match(/^\/fiu_api\/client\/consent\/request\/([^/]+)\/details$/);
  if (req.method === 'GET' && m) {
    const c = consents.get(m[1]);
    return c ? send(res, 200, {consent_request_id: c.id, status: c.status}) : send(res, 404, {code: 'NOT_FOUND'});
  }
  const AA_ACCOUNTS = [
    {account_id: 'MF1', fi_type: 'MUTUAL_FUNDS', fip_id: 'CAMS', masked_account_number: 'XXXX6704'},
    {account_id: 'DM1', fi_type: 'EQUITIES', fip_id: 'CDSL', masked_account_number: 'XXXX1201'},
    {account_id: 'IN1', fi_type: 'INSURANCE_POLICIES', fip_id: 'LIC', masked_account_number: 'XXXX9001'},
  ];
  m = path.match(/^\/fiu_api\/client\/fi\/request\/([^/]+)$/);
  if (req.method === 'POST' && m) {
    const c = consents.get(m[1]);
    if (c?.status !== 'ACTIVE') return send(res, 400, {code: 'CONSENT_NOT_ACTIVE'});
    c.fi = id('FRID');
    return send(res, 200, {fi_request_id: c.fi, status: 'PENDING', consent_request_id: c.id});
  }
  m = path.match(/^\/fiu_api\/client\/fi\/request\/([^/]+)\/details$/);
  if (req.method === 'GET' && m) {
    return send(res, 200, {fi_request_id: m[1], status: 'DATA_AVAILABLE', accounts: AA_ACCOUNTS});
  }
  m = path.match(/^\/fiu_api\/client\/fi\/fetch\/([^/]+)$/);
  if (req.method === 'GET' && m) {
    const acc = (a) => ({
      account_id: a.account_id,
      fi_type: a.fi_type,
      fip_id: a.fip_id,
      account_number: a.masked_account_number,
    });
    const holding = (h) => ({account: {summary: {investment: {holdings: {holding: h}}}}});
    return send(res, 200, {
      fi_request_id: m[1],
      status: 'DELIVERED',
      fi: [
        {
          ...acc(AA_ACCOUNTS[0]),
          fi_data: holding([
            {isin: 'INF000TEST1', schemeName: 'Test Index Fund', folioNo: 'F-1', closingUnits: '12', nav: '50'},
          ]),
        },
        {
          ...acc(AA_ACCOUNTS[1]),
          fi_data: {
            account: {
              summary: {currentValue: '9000', investment: {holdings: {holding: {issuerName: 'TEST LTD', units: 30}}}},
            },
          },
        },
        {
          ...acc(AA_ACCOUNTS[2]),
          fi_data: {
            account: {
              summary: {policyName: 'Test Term Plan', policyType: 'TERM', policyNumber: 'LIC-77', sumAssured: 2500000},
            },
          },
        },
      ],
    });
  }
  m = path.match(/^\/__test\/aa\/([^/]+)$/);
  if (req.method === 'POST' && m && consents.has(m[1])) {
    consents.get(m[1]).status = body.status ?? 'ACTIVE';
    return send(res, 200, {ok: true});
  }

  // API Setu: any issuer; a first detail of NOTFOUND has no certificate.
  m = path.match(/^\/apisetu\/([a-z]+)\/v3\/dtcer\/certificate$/);
  if (req.method === 'POST' && m) {
    if (!req.headers['x-apisetu-clientid'] || !req.headers['x-apisetu-apikey'])
      return send(res, 401, {error: 'invalid_client'});
    if (!/^[0-9a-f-]{36}$/.test(body.txnId ?? '')) return send(res, 400, {error: 'invalid_txnid'});
    if (Object.values(body.certificateParameters ?? {})[0] === 'NOTFOUND')
      return send(res, 404, {error: 'record_not_found'});
    return send(res, 200, '%PDF-1.4 stand-in death certificate', 'application/pdf');
  }

  // Blue Dart: a JWT, a waybill per parcel (one per reference), tracking until /__test/bluedart/:awb moves it.
  if (req.method === 'GET' && path === '/bluedart/token/v1/login') {
    return req.headers.clientid ? send(res, 200, {JWTToken: id('JWT')}) : send(res, 401, {message: 'No ClientID'});
  }
  const signedIn = Boolean(req.headers.jwttoken);
  if (req.method === 'POST' && path === '/bluedart/waybill/v1/GenerateWayBill') {
    if (!signedIn) return send(res, 401, {message: 'No JWTToken'});
    const r = body.Request ?? {};
    if (!/^\d{6}$/.test(r.Consignee?.ConsigneePincode ?? '')) {
      return send(res, 200, {GenerateWayBillResult: {IsError: true, Status: [{StatusInformation: 'Invalid pincode'}]}});
    }
    const awb = String(70000000000 + parcels.size + 1);
    parcels.set(awb, {type: 'PU', status: 'Shipment picked up'});
    return send(res, 200, {GenerateWayBillResult: {AWBNo: awb, IsError: false, Status: []}});
  }
  if (req.method === 'GET' && path === '/bluedart/tracking/v1/shipment') {
    if (!signedIn) return send(res, 401, {message: 'No JWTToken'});
    const p = parcels.get(url.searchParams.get('numbers'));
    if (!p) return send(res, 200, {ShipmentData: {Shipment: []}});
    return send(res, 200, {
      ShipmentData: {
        Shipment: [
          {
            Status: p.status,
            StatusType: p.type,
            Scans: [
              {ScanDetail: {Scan: p.status, ScanDate: '28-Nov-2026', ScanTime: '10:00', ScannedLocation: 'MUMBAI HUB'}},
            ],
          },
        ],
      },
    });
  }
  m = path.match(/^\/__test\/bluedart\/(\d+)$/);
  if (req.method === 'POST' && m && parcels.has(m[1])) {
    parcels.set(m[1], {type: body.type, status: body.status});
    return send(res, 200, {ok: true});
  }

  // WhatsApp Cloud API (Meta's Graph API): messages sent are kept for /__test/whatsapp.
  m = path.match(/^\/whatsapp\/([^/]+)\/messages$/);
  if (req.method === 'POST' && m) {
    if (!/^Bearer .+/.test(req.headers.authorization ?? '')) return send(res, 401, {error: {message: 'No token'}});
    if (!/^91[6-9]\d{9}$/.test(body.to ?? '')) return send(res, 400, {error: {message: 'Invalid recipient'}});
    const msgId = `wamid.out${waSent.length + 1}`;
    waSent.push({id: msgId, ...body});
    return send(res, 200, {messaging_product: 'whatsapp', messages: [{id: msgId}]});
  }
  if (req.method === 'GET' && path === '/__test/whatsapp') return send(res, 200, waSent);

  // Test controls: the applicant finishes the KYC, or signs.
  m = path.match(/^\/__test\/kyc\/([^/]+)$/);
  if (req.method === 'POST' && m && kycs.has(m[1])) {
    kycs.get(m[1]).status = body.status;
    return send(res, 200, {ok: true});
  }
  m = path.match(/^\/__test\/doc\/([^/]+)$/);
  if (m && docs.has(m[1])) {
    if (req.method === 'POST') docs.get(m[1]).agreement_status = body.status;
    return send(res, 200, {agreement_status: docs.get(m[1]).agreement_status, estamp: docs.get(m[1]).estamp});
  }
  send(res, 404, {code: 'NOT_FOUND', message: `${req.method} ${path}`});
});

server.listen(Number(process.env.PORT ?? 4090), () => console.log('digio stand-in on', server.address().port));
