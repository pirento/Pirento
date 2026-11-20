import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MAX_HISTORY, SYSTEM, buildRequest} from './prompt.js';

test('system prompt carries real prices and links', () => {
  assert.match(SYSTEM, /Private Limited Company Registration \(legal\) — ₹1999 — \/services\/private-limited-company/);
  assert.match(SYSTEM, /per tree/);
});

test('request trims history, starts on a user turn and keeps the prompt cacheable', () => {
  const history = Array.from({length: 30}, (_, i) => ({role: i % 2 ? 'assistant' : 'user', content: `m${i}`, at: 1}));
  const req = buildRequest(history);
  assert.equal(req.messages.length, MAX_HISTORY);
  assert.equal(req.messages[0].role, 'user');
  assert.deepEqual(Object.keys(req.messages[0]), ['role', 'content']);
  assert.equal(req.system[0].cache_control.type, 'ephemeral');
  assert.equal(req.model, 'claude-opus-5-5');
});
