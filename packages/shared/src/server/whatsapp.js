// WhatsApp Business (Meta's Cloud API) for every service: send a template (allowed any time, for notifications) or
// plain text (only inside the 24 hours after the person last wrote), and check the signature on incoming webhooks.
// Pirento's WhatsApp number is WHATSAPP_NUMBER; WHATSAPP_PHONE_ID is that number's id in Meta's dashboard.
import crypto from 'node:crypto';
import {env} from './env.js';
import {ApiError} from './errors.js';
import {safeEqual} from './internal.js';

export const whatsappNumber = () => env('WHATSAPP_NUMBER', '919988556368');
export const whatsappOn = () => Boolean(env('WHATSAPP_TOKEN', '') && env('WHATSAPP_PHONE_ID', ''));

/** "+919876543210" or "9876543210" → "919876543210", the form WhatsApp uses; null if not an Indian mobile. */
export function waId(phone) {
  const d = String(phone ?? '').replace(/\D/g, '');
  const local = d.length === 12 && d.startsWith('91') ? d.slice(2) : d;
  return /^[6-9]\d{9}$/.test(local) ? `91${local}` : null;
}

/**
 * Sends one message: `{text}` (an open chat) or `{template, params}` (any time; the template must be approved in
 * Meta's dashboard with as many {{n}} as params). Returns WhatsApp's message id.
 */
export async function sendWhatsApp(to, {text, template, params = [], language = 'en'}) {
  if (!whatsappOn()) throw new ApiError(503, 'WHATSAPP_OFF', 'WhatsApp is not switched on yet');
  const number = waId(to);
  if (!number) throw new ApiError(400, 'BAD_NUMBER', 'Not a WhatsApp number we can write to');
  const body = text
    ? {messaging_product: 'whatsapp', to: number, type: 'text', text: {body: text.slice(0, 4096), preview_url: true}}
    : {
        messaging_product: 'whatsapp',
        to: number,
        type: 'template',
        template: {
          name: template,
          language: {code: language},
          components: [{type: 'body', parameters: params.map((p) => ({type: 'text', text: String(p)}))}],
        },
      };
  const url = `${env('WHATSAPP_API_URL', 'https://graph.facebook.com/v21.0')}/${env('WHATSAPP_PHONE_ID', '')}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {authorization: `Bearer ${env('WHATSAPP_TOKEN', '')}`, 'content-type': 'application/json'},
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  }).catch(() => null);
  const json = res ? await res.json().catch(() => ({})) : {};
  if (!res?.ok) {
    throw new ApiError(502, 'WHATSAPP_FAILED', json.error?.message?.slice(0, 160) || 'WhatsApp did not take it');
  }
  return json.messages?.[0]?.id ?? '';
}

/** Meta signs each webhook with the app secret: X-Hub-Signature-256 = "sha256=" + HMAC-SHA256 of the raw body. */
export function whatsappSignatureOk(rawBody, header) {
  const secret = env('WHATSAPP_APP_SECRET', '');
  if (!secret || !rawBody || !header) return false;
  const want = `sha256=${crypto.createHmac('sha256', secret).update(rawBody).digest('hex')}`;
  return safeEqual(want, String(header));
}
