// Tests for notices.js: every event is well formed, and each channel's text keeps its limits.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {NOTICE_CHANNELS, NOTICE_EVENTS, noticeEvent, renderNotice} from './notices.js';

test('every event has an id, a title, a sample and all four channels', () => {
  assert.equal(new Set(NOTICE_EVENTS.map((e) => e.id)).size, NOTICE_EVENTS.length);
  for (const e of NOTICE_EVENTS) {
    assert.ok(e.title && e.sample?.big, e.id);
    assert.deepEqual(Object.keys(e.channels).sort(), [...NOTICE_CHANNELS].sort(), e.id);
  }
  assert.equal(noticeEvent('nope').id, 'general');
});

test('SMS stays within 300 characters, WhatsApp template values on one line each', () => {
  const r = renderNotice({
    brand: 'Pirento Legal',
    label: 'Ticket #10000041',
    big: 'New reply',
    note: `Line one\nline two ${'x'.repeat(400)}`,
    link: '/support',
  });
  assert.ok(r.sms.length <= 300);
  assert.ok(r.sms.startsWith('Pirento Legal: Ticket #10000041 - New reply.'));
  assert.equal(r.whatsapp.template.length, 4);
  assert.ok(r.whatsapp.template.every((v) => !/\n/.test(v) && v.length <= 1024));
  assert.ok(r.whatsapp.template[3].endsWith('https://pirento.com/support'));
  assert.ok(r.whatsapp.text.startsWith('*Pirento Legal*\nTicket #10000041: *New reply*'));
  assert.equal(r.email.subject, 'Pirento Legal: New reply · Ticket #10000041');
});

test('WhatsApp words and numbers turn into intents', async () => {
  const {waIntent, WA_TEXT} = await import('./whatsapp.js');
  assert.deepEqual(waIntent(' STOP '), {kind: 'stop'});
  assert.deepEqual(waIntent('Hi'), {kind: 'menu'});
  assert.deepEqual(waIntent('7'), {kind: 'human'});
  assert.equal(waIntent('2').kind, 'ask');
  assert.match(waIntent('2').text, /parcels/);
  assert.deepEqual(waIntent('mera order kab aayega?'), {kind: 'ask', text: 'mera order kab aayega?'});
  assert.match(WA_TEXT.menu(), /\*1\* My orders/);
});
