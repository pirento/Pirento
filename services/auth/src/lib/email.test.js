// Tests for email.js.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import nodemailer from 'nodemailer';
import {renderOtpEmail, sendNoticeEmail, sendOtpEmail} from './email.js';

test('OTP email carries the code and brand, escaped', () => {
  const {subject, text, html} = renderOtpEmail({code: '123456', brand: 'Pirento <Legal>'});
  assert.match(subject, /^123456 is your Pirento <Legal> sign-in code$/);
  assert.match(text, /123456/);
  assert.match(html, /123456/);
  assert.ok(html.includes('Pirento &#60;Legal&#62;') && !html.includes('<Legal>'));
});

test('sendOtpEmail builds a real message', async () => {
  const via = nodemailer.createTransport({jsonTransport: true});
  const sent = [];
  const spy = {sendMail: async (m) => sent.push(JSON.parse((await via.sendMail(m)).message))};
  await sendOtpEmail('a@example.com', '654321', 'Pirento AI', spy);
  assert.equal(sent[0].to[0].address, 'a@example.com');
  assert.match(sent[0].subject, /654321/);
  assert.match(sent[0].html, /Pirento AI/);
});

test('without a mail server, production refuses a notice instead of logging its secret', async () => {
  const before = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    const notice = {brand: 'Pirento', label: 'Your user ID', big: 'asha', note: 'Your password is secret-123'};
    await assert.rejects(sendNoticeEmail('a@example.com', notice, null), {code: 'EMAIL_UNAVAILABLE'});
  } finally {
    process.env.NODE_ENV = before;
  }
});
