// A stand-in for the Digio API in local tests and CI: the KYC and sign endpoints Bharat ID calls, kept in memory,
// plus /__test routes to play the applicant finishing each step. Usage: node scripts/digio-standin.mjs (port 4090).
import http from 'node:http';
import crypto from 'node:crypto';

const kycs = new Map();
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
  if (!path.startsWith('/__test') && !/^Basic .+/.test(req.headers.authorization ?? '')) {
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
