// Sends one notice: kept for the dashboard bell, then on each channel admin left on for its event and the person
// allows (email, SMS, WhatsApp), each in its own format (renderNotice, shared). Every channel's outcome is logged.
// "Important" events (money, identity, safety) ignore a person's email and SMS switches; WhatsApp always needs their
// opt-in, as Meta requires. A failure on one channel never stops the others or the caller.
import {NOTICE_CHANNELS, NOTICE_EVENTS, noticeEvent, renderNotice} from '@pirento/shared';
import {cached, env, forget, sendWhatsApp, whatsappOn} from '@pirento/shared/server';
import {Notice} from '../models/Notice.js';
import {NoticeDelivery} from '../models/NoticeDelivery.js';
import {NoticeSetting} from '../models/NoticeSetting.js';
import {sendNoticeEmail} from './email.js';
import {phoneCodesOn, sendSms} from './sms.js';

const SETTINGS_KEY = 'auth:notice-settings';
export const WA_TEMPLATE = () => env('WHATSAPP_NOTICE_TEMPLATE', 'pirento_update');

/** Every event with the channels in force: admin's choice over the defaults. Cached a minute. */
export async function eventSettings() {
  const rows = await cached(SETTINGS_KEY, 60, () => NoticeSetting.find().lean());
  return NOTICE_EVENTS.map((e) => {
    const row = rows.find((r) => r._id === e.id);
    return {...e, channels: {...e.channels, ...(row?.channels ?? {})}, changed: Boolean(row)};
  });
}
export const forgetSettings = () => forget(SETTINGS_KEY);

/** Whether a channel can send at all on this server. */
export const channelReady = () => ({
  dashboard: true,
  email: Boolean(process.env.SMTP_URL) || process.env.NODE_ENV !== 'production',
  sms: phoneCodesOn(),
  whatsapp: whatsappOn(),
});

/**
 * Which channels this notice goes on for this person, and why each other one does not: {channel: true | reason}.
 * Pure, so it is tested on its own.
 */
export function plan(event, settings, user, ready) {
  const prefs = user.noticePrefs ?? {};
  const muted = (prefs.muted ?? []).includes(event.product) && !event.important;
  const out = {};
  for (const c of NOTICE_CHANNELS) {
    if (!settings.channels[c]) out[c] = 'off for this event';
    else if (!ready[c]) out[c] = 'channel not set up';
    else if (c === 'dashboard') out[c] = true;
    else if ((c === 'sms' || c === 'whatsapp') && !user.phone) out[c] = 'no mobile on the account';
    else if (c === 'whatsapp' && !prefs.whatsapp) out[c] = 'not opted in to WhatsApp';
    else if (muted) out[c] = 'product muted';
    else if (!event.important && prefs[c] === false) out[c] = 'switched off by the person';
    else out[c] = true;
  }
  return out;
}

const log = (rows) => NoticeDelivery.insertMany(rows).catch((err) => console.error('notice log', err.message));

/** Sends a notice row ({userId, event, brand, label, big, note, link}) to a user document. */
export async function deliver(user, row) {
  const event = noticeEvent(row.event);
  const settings = (await eventSettings()).find((e) => e.id === event.id);
  const route = plan(event, settings, user, channelReady());
  const r = renderNotice(row, (process.env.SITE_URL ?? 'https://pirento.com').replace(/\/$/, ''));
  const notice =
    route.dashboard === true ? await Notice.create({...r.dashboard, userId: row.userId, event: event.id}) : null;
  const base = {noticeId: notice ? String(notice._id) : undefined, userId: row.userId, event: event.id};
  const sends = {
    email: () => sendNoticeEmail(user.email, r.dashboard),
    sms: () => sendSms(user.phone, r.sms),
    whatsapp: () => sendWhatsApp(user.phone, {template: WA_TEMPLATE(), params: r.whatsapp.template}),
  };
  const rows = [
    {...base, channel: 'dashboard', status: notice ? 'sent' : 'skipped', reason: notice ? '' : route.dashboard},
  ];
  await Promise.all(
    Object.entries(sends).map(async ([channel, send]) => {
      if (route[channel] !== true) return rows.push({...base, channel, status: 'skipped', reason: route[channel]});
      try {
        const ref = await send();
        rows.push({...base, channel, status: 'sent', ref: typeof ref === 'string' ? ref : ''});
      } catch (err) {
        rows.push({...base, channel, status: 'failed', reason: String(err.message).slice(0, 200)});
      }
    }),
  );
  log(rows);
  return {notice, route};
}
