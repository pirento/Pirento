// API Setu: asks the body that issued a death certificate for it, by the details on the certificate. A PDF back means
// the government record exists; then Pirento AI reads the name on it so the team knows it is the owner's.
import crypto from 'node:crypto';
import {ApiError, badInput, callService} from '@pirento/shared/server';
import {deathIssuer, namesMatch} from '@pirento/shared';
import {apisetuOn, config} from '../config.js';

/** The certificate PDF, or null when the issuer has no certificate with those details. */
export async function fetchDeathCertificate(issuerId, params) {
  if (!apisetuOn())
    throw new ApiError(503, 'APISETU_OFF', 'API Setu is not switched on yet; check the certificate by hand');
  const issuer = deathIssuer(issuerId);
  if (!issuer) throw badInput('Choose who issued the certificate');
  const certificateParameters = {};
  for (const p of issuer.params) {
    const v = String(params?.[p.id] ?? '').trim();
    if (!v || v.length > 60) throw badInput(`Enter the ${p.label.toLowerCase()}`);
    certificateParameters[p.id] = v;
  }
  const txnId = crypto.randomUUID();
  const res = await fetch(`${config.apisetu.url}/${issuer.id}/v3/dtcer/certificate`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'X-APISETU-CLIENTID': config.apisetu.clientId,
      'X-APISETU-APIKEY': config.apisetu.apiKey,
    },
    body: JSON.stringify({txnId, format: 'pdf', certificateParameters}),
    signal: AbortSignal.timeout(30_000),
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('apisetu', issuer.id, res.status, err.error);
    throw new ApiError(502, 'APISETU_FAILED', err.errorDescription || 'API Setu did not answer. Try again later.');
  }
  const pdf = Buffer.from(await res.arrayBuffer());
  if (!pdf.subarray(0, 5).equals(Buffer.from('%PDF-')))
    throw new ApiError(502, 'APISETU_FAILED', 'API Setu sent no PDF');
  return {pdf, txnId, issuer, number: Object.values(certificateParameters)[0]};
}

/**
 * Pirento AI reads the certificate: the name and date of death on it, and whether the name is the owner's.
 * Null when the AI is off or gave no answer, so the team compares the names by hand.
 */
export async function readCertificate(pdf, ownerName) {
  const read = await callService(
    config.aiUrl,
    '/internal/jobs/deathCertificate',
    {
      input: {task: 'Read this death certificate.'},
      attachments: [
        {type: 'document', source: {type: 'base64', media_type: 'application/pdf', data: pdf.toString('base64')}},
      ],
    },
    {timeoutMs: 120_000},
  ).catch((err) => {
    console.error('certificate read', err.message);
    return null;
  });
  if (!read) return null;
  return {
    name: read.deceasedName,
    dateOfDeath: read.dateOfDeath,
    isDeathCertificate: read.isDeathCertificate,
    match: read.isDeathCertificate && namesMatch(read.deceasedName, ownerName),
  };
}
