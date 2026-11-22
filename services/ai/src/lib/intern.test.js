import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JOBS, buildJob} from './intern.js';

test('every job keeps a frozen system prompt and asks for JSON', () => {
  for (const kind of Object.keys(JOBS)) {
    const req = buildJob(kind, {a: 1});
    assert.equal(req.system[0].text, JOBS[kind].system);
    assert.ok(!/\d{4}-\d{2}-\d{2}/.test(req.system[0].text), 'no dates in the cached prefix');
    assert.ok(req.output_config.format);
    assert.equal(req.messages[0].content, '{"a":1}');
  }
});
