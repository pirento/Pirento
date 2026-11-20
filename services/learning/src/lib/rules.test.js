import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EXAM_RULES} from '@pirento/shared';
import {TRACKS, bankForSlug} from '@pirento/shared/exam';

// The website promises this many questions per exam; every bank must keep that promise.
test('every track has the advertised number of questions', () => {
  for (const t of TRACKS) assert.equal(bankForSlug(t.slug).length, EXAM_RULES.questions, t.slug);
});
