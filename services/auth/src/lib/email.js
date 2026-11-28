// Email clients ignore CSS variables and stylesheets, so the brand colours from
// the brand guidelines (Appendix A) are written inline: Pirento dark, master red,
// light neutral, and a body grey that passes 4.5:1 on white.
import nodemailer from 'nodemailer';
import {ApiError, isProduction} from '@pirento/shared/server';

const C = {paper: '#F4F6F7', ink: '#1B2A33', muted: '#56636C', rule: '#D6D6D6', accent: '#E40E2A'};

const escape = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** The sign-in code email. `brand` is "Pirento Ecosystem" or a product name. */
export function renderOtpEmail({code, brand}) {
  const subject = `${code} is your ${brand} sign-in code`;
  const text = `Your ${brand} sign-in code is ${code}.\n\nIt works for 10 minutes. If you did not ask for it, ignore this email.\n\nVenturecore Solutions Private Limited`;
  const html = `<!doctype html>
<html lang="en"><body style="margin:0;background:${C.paper};font-family:Inter,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:${C.ink}">
  <div style="max-width:520px;margin:0 auto;padding:40px 20px">
    <p style="margin:0 0 28px;font-size:13px;letter-spacing:.06em;text-transform:uppercase;font-weight:600">
      <span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${C.accent};margin-right:8px"></span>${escape(brand)}
    </p>
    <div style="border:1px solid ${C.rule};border-radius:22px;padding:32px;background:#ffffff">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:${C.muted}">Sign-in code</p>
      <p style="margin:0 0 20px;font-size:40px;letter-spacing:.12em;font-weight:600">${escape(code)}</p>
      <p style="margin:0;font-size:15px;line-height:1.7;color:${C.muted}">It works for 10 minutes. If you did not ask for it, ignore this email; nobody can sign in without the code.</p>
    </div>
    <p style="margin:24px 0 0;font-size:12px;color:${C.muted}">Venturecore Solutions Private Limited · This is an automated message.</p>
  </div>
</body></html>`;
  return {subject, text, html};
}

let transport;
/** null when SMTP_URL is not set: callers decide what that means. */
export const mailer = () =>
  process.env.SMTP_URL ? (transport ??= nodemailer.createTransport(process.env.SMTP_URL)) : null;

export async function sendOtpEmail(to, code, brand, via = mailer()) {
  const {subject, text, html} = renderOtpEmail({code, brand});
  await via.sendMail({from: process.env.EMAIL_FROM ?? 'Pirento <no-reply@pirento.com>', to, subject, text, html});
}

/**
 * A notice email: the product, what it is about, what happened in large type, the details, a button to the page it
 * is about (when there is one) and a line on changing which notices arrive. Words from renderNotice (shared).
 */
export function renderNoticeEmail({brand = 'Pirento', label = '', big = '', note = '', link = ''}) {
  const site = (process.env.SITE_URL ?? 'https://pirento.com').replace(/\/$/, '');
  const url = link ? (/^https?:/.test(link) ? link : `${site}${link}`) : '';
  const subject = `${brand}: ${big}${label ? ` · ${label}` : ''}`;
  const text = [
    label,
    big,
    note,
    url,
    `Change which notices you get: ${site}/notifications`,
    'Venturecore Solutions Private Limited',
  ]
    .filter(Boolean)
    .join('\n\n');
  const html = `<!doctype html>
<html lang="en"><body style="margin:0;background:${C.paper};font-family:Inter,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:${C.ink}">
  <div style="max-width:520px;margin:0 auto;padding:40px 20px">
    <p style="margin:0 0 28px;font-size:13px;letter-spacing:.06em;text-transform:uppercase;font-weight:600">
      <span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${C.accent};margin-right:8px"></span>${escape(brand)}
    </p>
    <div style="border:1px solid ${C.rule};border-radius:22px;padding:32px;background:#ffffff">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:${C.muted}">${escape(label)}</p>
      <p style="margin:0 0 16px;font-size:28px;line-height:1.25;font-weight:600">${escape(big)}</p>
      <p style="margin:0;font-size:15px;line-height:1.7;color:${C.muted}">${escape(note)}</p>
      ${url ? `<p style="margin:24px 0 0"><a href="${escape(url)}" style="display:inline-block;background:${C.ink};color:#ffffff;text-decoration:none;border-radius:999px;padding:12px 22px;font-size:14px">Open</a></p>` : ''}
    </div>
    <p style="margin:24px 0 0;font-size:12px;color:${C.muted}">Venturecore Solutions Private Limited · <a href="${escape(site)}/notifications" style="color:${C.muted}">Change which notices you get</a></p>
  </div>
</body></html>`;
  return {subject, text, html};
}
export async function sendNoticeEmail(to, notice, via = mailer()) {
  const {subject, text, html} = renderNoticeEmail(notice);
  if (!via) {
    // A notice can carry a first password or a one-time sign-in link: in production, without a mail server, refuse
    // rather than print it to the logs and report it as sent.
    if (isProduction()) throw new ApiError(503, 'EMAIL_UNAVAILABLE', 'Email is not set up yet');
    return console.log(`Email to ${to}: ${text} (no SMTP_URL, so not sent)`);
  }
  await via.sendMail({from: process.env.EMAIL_FROM ?? 'Pirento <no-reply@pirento.com>', to, subject, text, html});
}
