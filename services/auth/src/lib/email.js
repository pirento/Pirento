import nodemailer from 'nodemailer';

// Email clients ignore CSS variables and stylesheets, so the brand colours from
// the brand guidelines (Appendix A) are written inline: Pirento dark, master red,
// light neutral, and a body grey that passes 4.5:1 on white.
const C = {paper: '#F4F6F7', ink: '#1B2A33', muted: '#56636C', rule: '#D6D6D6', accent: '#E40E2A'};

const escape = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** The sign-in code email. `brand` is "Pirento Ecosystem" or a product name. */
export function renderOtpEmail({code, brand}) {
  const subject = `${code} is your ${brand} sign-in code`;
  const text = `Your ${brand} sign-in code is ${code}.\n\nIt works for 10 minutes. If you did not ask for it, ignore this email.\n\nPirento Ecosystem Pvt. Ltd.`;
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
    <p style="margin:24px 0 0;font-size:12px;color:${C.muted}">Pirento Ecosystem Pvt. Ltd. · This is an automated message.</p>
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
