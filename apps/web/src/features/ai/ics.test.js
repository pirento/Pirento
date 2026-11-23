// Tests for ics.js.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {icsFile} from './ics.js';

test('one event per valid date, each with a reminder 3 days before', () => {
  const ics = icsFile([
    {what: 'GSTR-3B, October', due: '2026-11-20', note: 'Monthly; file online'},
    {what: 'Bad date', due: 'next Tuesday', note: ''},
  ]);
  assert.equal(ics.match(/BEGIN:VEVENT/g).length, 1);
  assert.match(ics, /DTSTART;VALUE=DATE:20261120/);
  assert.match(ics, /TRIGGER:-P3D/);
  assert.match(ics, /SUMMARY:GSTR-3B\\, October/); // commas escaped
  assert.ok(ics.startsWith('BEGIN:VCALENDAR') && ics.endsWith('END:VCALENDAR'));
});
