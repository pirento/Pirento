// The Digio API calls Bharat ID needs: a KYC request and its result, a sign request for the declaration and its file.
import {ApiError} from '@pirento/shared/server';
import {config, digioOn} from '../config.js';

const auth = () => `Basic ${Buffer.from(`${config.digio.clientId}:${config.digio.clientSecret}`).toString('base64')}`;

async function call(method, path, body, {raw = false} = {}) {
  if (!digioOn()) throw new ApiError(503, 'DIGIO_OFF', 'Verification with Digio is not switched on yet');
  const res = await fetch(config.digio.api + path, {
    method,
    headers: {authorization: auth(), ...(body ? {'content-type': 'application/json'} : {})},
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('digio', method, path, res.status, err.code, err.message);
    throw new ApiError(502, 'DIGIO_FAILED', err.message || 'Digio did not answer. Try again in a minute.');
  }
  return raw ? res : res.json();
}

const lower = (s) => String(s ?? '').toLowerCase();

/**
 * Starts a KYC request on a DigiStudio template (the application's video KYC by default, or an Aadhaar OTP or face
 * check for a later sign-in); the SDK opens it with the returned token.
 */
export async function createKyc({
  identity,
  name,
  attempt,
  template = config.digio.kycTemplate,
  reference = `BID${identity._id}`,
  transaction = `BID${identity._id}T${attempt}`,
}) {
  const r = await call('POST', '/client/kyc/v2/request/with_template', {
    customer_identifier: identity.email,
    customer_name: name?.slice(0, 100),
    template_name: template,
    reference_id: reference,
    transaction_id: transaction,
    notify_customer: false, // the person starts it from our dashboard
    generate_access_token: true,
    expire_in_days: 10,
  });
  return {id: r.id, status: lower(r.status), token: r.access_token?.id, tokenUntil: r.access_token?.valid_till};
}

/** Where a KYC request stands, and the files its steps produced (for staff to see). */
export async function kycResult(id) {
  const r = await call('POST', `/client/kyc/v2/${encodeURIComponent(id)}/response`);
  const actions = (r.actions ?? []).map((a) => ({
    kind: a.type,
    status: lower(a.status),
    fileId: a.file_id || undefined,
  }));
  return {status: lower(r.status ?? r.request_details?.status), actions};
}

/** A KYC file (video, selfie, document) as a fetch Response, for streaming to staff. */
export const kycMedia = (fileId) =>
  call('GET', `/client/kyc/v2/media/${encodeURIComponent(fileId)}`, null, {raw: true});

/**
 * Sends the declaration for Aadhaar eSign, with an e-stamp when a stamp tag is set.
 * `callback` is Digio's idempotency key: the same one returns the same document.
 */
export async function createSignRequest({identity, name, pdf, callback}) {
  const r = await call('POST', '/v2/client/document/uploadpdf', {
    file_name: `Bharat-ID-declaration-${identity._id}.pdf`,
    file_data: pdf.toString('base64'),
    callback,
    signers: [{identifier: identity.email, name, reason: 'Bharat ID declaration', sign_type: 'aadhaar'}],
    expire_in_days: 10,
    display_on_page: 'last',
    notify_signers: false,
    send_sign_link: false,
    generate_access_token: true,
    ...(config.digio.estampTag && {
      estamp_request: {tags: {[config.digio.estampTag]: 1}, sign_on_page: 'first', note_on_page: 'first'},
    }),
  });
  return {id: r.id, token: r.access_token?.id, status: lower(r.agreement_status)};
}

/** 'completed' once every signer has signed. */
export const documentStatus = async (id) =>
  lower((await call('GET', `/v2/client/document/${encodeURIComponent(id)}`)).agreement_status);

/** The signed (and stamped) PDF as a fetch Response. */
export const signedDocument = (id) =>
  call('GET', `/v2/client/document/download?document_id=${encodeURIComponent(id)}`, null, {raw: true});
