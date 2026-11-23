// Tests for bank.js.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TRACKS} from '@pirento/shared/exam';
import {mergeTracks} from './bank.js';

test('admin settings override a built-in track and new tracks follow', () => {
  const slug = TRACKS[0].slug;
  const merged = mergeTracks([
    {slug, name: 'Renamed', minutes: 45, passPercent: 70, questions: 15, active: false},
    {slug: 'new-track-x', name: 'New', minutes: 20, passPercent: 60, questions: 5, active: true},
  ]);
  assert.equal(merged.length, TRACKS.length + 1);
  assert.deepEqual(
    {...merged[0]},
    {slug, name: 'Renamed', minutes: 45, passPercent: 70, questions: 15, active: false, builtIn: true},
  );
  assert.equal(merged.at(-1).builtIn, false);
  assert.equal(merged[1].minutes, 30); // untouched built-in keeps the default rules
});
