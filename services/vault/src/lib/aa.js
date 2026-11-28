// Digio's Account Aggregator (FIU-TSP API): ask for the owner's consent, follow it, request the data once it is
// active, and write the holdings into the vault as sealed records. Consents ask Digio to raise a fresh data request
// every month, and a daily job here catches anything a webhook missed.
import {ApiError, encrypt, notify} from '@pirento/shared/server';
import {aaOn, config} from '../config.js';
import {Link} from '../models/Link.js';
import {Record} from '../models/Record.js';
import {recordsFrom} from './holdings.js';
import {logAction} from './log.js';

const DAY = 86_400_000;
const auth = () => `Basic ${Buffer.from(`${config.digio.clientId}:${config.digio.clientSecret}`).toString('base64')}`;

async function call(method, path, body) {
  if (!aaOn()) throw new ApiError(503, 'AA_OFF', 'Fetching accounts through Digio is not switched on yet');
  const res = await fetch(config.digio.api + path, {
    method,
    headers: {authorization: auth(), ...(body ? {'content-type': 'application/json'} : {})},
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30_000),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('digio aa', method, path, res.status, json.code, json.message);
    throw new ApiError(502, 'DIGIO_FAILED', json.message || 'Digio did not answer. Try again in a minute.');
  }
  return json;
}

/** "YYYY-MM-DD HH:MM:SS" in India time, the format Digio's FIU API takes. */
export const istStamp = (d) => new Date(d.getTime() + 330 * 60_000).toISOString().slice(0, 19).replace('T', ' ');

const STATUS = {
  PENDING: 'pending',
  REQUESTED: 'pending',
  APPROVED: 'approved',
  ACTIVE: 'active',
  REJECTED: 'rejected',
  REVOKED: 'revoked',
  PAUSED: 'paused',
  EXPIRED: 'expired',
  FAILED: 'failed',
};
const statusOf = (s) => STATUS[String(s ?? '').toUpperCase()];
const accountsOf = (list = []) =>
  list.map((a) => ({accountId: a.account_id, fiType: a.fi_type, fipId: a.fip_id, masked: a.masked_account_number}));

/** Starts a consent request for the owner: a year of consent, a year of history, a fresh fetch each month. */
export async function requestConsent({userId, name, mobile, pan, dob}) {
  const now = new Date();
  const r = await call('POST', '/client/consent/request', {
    customer_id: userId,
    customer_details: {
      customer_name: name,
      customer_mobile: mobile,
      customer_identifier: mobile, // the AA profile is found by the mobile it is registered with
      customer_ref_id: userId,
    },
    template_id: config.digio.template,
    consent_details: {
      consent_start_date: istStamp(now),
      consent_expiry_date: istStamp(new Date(now.getTime() + 365 * DAY)),
      fi_start_date: istStamp(new Date(now.getTime() - 365 * DAY)),
      fi_end_date: istStamp(new Date(now.getTime() + 365 * DAY)),
      meta: {...(pan && {pan}), ...(dob && {dob}), show_consent_info: true},
    },
    notify_customer: false, // the owner starts it from the dashboard
    fi_schedule: {monthly_frequency_meta: {fi_request_time: '06:00:00', dates_of_month: [1]}},
  });
  const link = await Link.create({
    userId,
    consentRequestId: r.consent_request_id,
    customerId: r.customer_details?.id,
    status: statusOf(r.status) ?? 'pending',
    nextFetchAt: new Date(now.getTime() + DAY),
  });
  return {link, gatewayToken: r.gateway_token_id};
}

/** Writes delivered data into the vault: new holdings are added, known ones updated. Returns how many. */
async function store(link, fi) {
  let count = 0;
  for (const item of fi) {
    for (const rec of recordsFrom({
      fiType: item.fi_type,
      accountId: item.account_id,
      masked: item.account_number,
      fipId: item.fip_id,
      fiData: item.fi_data,
    })) {
      await Record.updateOne(
        {userId: link.userId, externalId: rec.externalId},
        {
          $set: {
            kind: rec.kind,
            title: rec.title,
            fields: encrypt(config.key, Buffer.from(JSON.stringify(rec.fields))),
            source: 'digio',
            linkId: String(link._id),
          },
          $setOnInsert: {release: false},
        },
        {upsert: true},
      );
      count++;
    }
  }
  return count;
}

/**
 * Moves one link forward as far as it can go now: reads the consent, asks for data once it is active, and stores
 * the data once it is ready. Webhooks call it, so does the owner's "check now" and the daily job.
 */
export async function advance(link) {
  const consent = await call('GET', `/client/consent/request/${encodeURIComponent(link.consentRequestId)}/details`);
  const status = statusOf(consent.status) ?? link.status;
  const set = {status, error: undefined};
  if (consent.accounts) set.accounts = accountsOf(consent.accounts);
  let stored = 0;
  // Data delivered within the day is current: nothing to ask for until tomorrow.
  const stale = !link.fetchedAt || Date.now() - link.fetchedAt.getTime() > DAY;
  if (status === 'active' && (stale || link.fiStatus !== 'DELIVERED')) {
    let fiRequestId = link.fiRequestId;
    if (!fiRequestId || link.fiStatus === 'DELIVERED' || link.fiStatus === 'FAILED') {
      const now = new Date();
      const fr = await call('POST', `/client/fi/request/${encodeURIComponent(link.consentRequestId)}`, {
        fi_start_date: istStamp(new Date(now.getTime() - 365 * DAY)),
        fi_end_date: istStamp(now),
      });
      fiRequestId = fr.fi_request_id;
      set.fiRequestId = fiRequestId;
      set.fiStatus = String(fr.status ?? 'PENDING').toUpperCase();
    }
    const fr = await call('GET', `/client/fi/request/${encodeURIComponent(fiRequestId)}/details`);
    set.fiStatus = String(fr.status ?? set.fiStatus ?? '').toUpperCase();
    if (fr.accounts?.length) set.accounts = accountsOf(fr.accounts);
    if (set.fiStatus === 'DATA_AVAILABLE' || set.fiStatus === 'PARTIALLY_DELIVERED') {
      const data = await call('GET', `/client/fi/fetch/${encodeURIComponent(fiRequestId)}`);
      stored = await store(link, data.fi ?? []);
      set.fiStatus = 'DELIVERED';
      set.fetchedAt = new Date();
    }
  }
  await Link.updateOne({_id: link._id}, {$set: set});
  if (stored) {
    await logAction(link.userId, 'linked.fetched', {target: `${stored} holdings`, by: 'system'});
    notify(link.userId, {
      brand: 'Pirento Vault',
      label: 'Linked accounts',
      big: `${stored} holdings updated`,
      note: 'Your mutual funds, stocks, ETFs and insurance were fetched through Digio and sealed in your vault.',
    });
  }
  return {status, fiStatus: set.fiStatus ?? link.fiStatus, stored};
}

/** The daily pass: every live link whose turn has come, each claimed by moving nextFetchAt so one copy takes it. */
export async function refreshLinks(now = new Date()) {
  if (!aaOn()) return 0;
  let done = 0;
  for (;;) {
    const link = await Link.findOneAndUpdate(
      {status: {$in: ['pending', 'approved', 'active']}, nextFetchAt: {$lte: now}},
      {$set: {nextFetchAt: new Date(now.getTime() + DAY)}},
      {new: true},
    );
    if (!link) return done;
    await advance(link).catch((err) =>
      Link.updateOne({_id: link._id}, {$set: {error: String(err.message).slice(0, 200)}}),
    );
    done++;
  }
}

export function startLinkRefresh() {
  const run = () => refreshLinks().catch((err) => console.error('vault links', err.message));
  setTimeout(run, 60_000).unref();
  setInterval(run, 3_600_000).unref();
}
