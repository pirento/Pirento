// Sends a text message through whatever SMS provider the install points SMS_WEBHOOK_URL at.
// The webhook gets POST {to, text} (with SMS_WEBHOOK_TOKEN as a bearer token if set), so any
// provider can be plugged in with a few lines on its side and none here.
import {ApiError, env, isProduction} from '@pirento/shared/server';

export const smsReady = () => Boolean(env('SMS_WEBHOOK_URL', ''));

/** True when phone codes can work: a provider is set, or this is not production (codes show on screen). */
export const phoneCodesOn = () => smsReady() || !isProduction();

export async function sendSms(to, text, fetchImpl = fetch) {
  if (!smsReady()) {
    if (isProduction()) throw new ApiError(503, 'SMS_UNAVAILABLE', 'Mobile codes are not set up yet');
    console.log(`SMS to ${to}: ${text} (no SMS_WEBHOOK_URL, so not sent)`);
    return;
  }
  const token = env('SMS_WEBHOOK_TOKEN', '');
  const res = await fetchImpl(env('SMS_WEBHOOK_URL', ''), {
    method: 'POST',
    headers: {'content-type': 'application/json', ...(token ? {authorization: `Bearer ${token}`} : {})},
    body: JSON.stringify({to, text}),
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null);
  if (!res?.ok) throw new ApiError(502, 'SMS_FAILED', 'We could not text the code. Check the number and try again.');
}
