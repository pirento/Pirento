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

test('knowledge is its own cached block, and the product goes last as a system message', () => {
  const req = buildRequest([{role: 'user', content: 'hi'}], {
    knowledge: 'Refunds take 7 days.',
    product: 'Pirento Legal',
  });
  assert.equal(req.system.length, 2);
  assert.equal(req.system[0].text, SYSTEM);
  assert.match(req.system[1].text, /Refunds take 7 days/);
  assert.deepEqual(req.messages.at(-1), {
    role: 'system',
    content: 'The person is asking from the Pirento Legal part of Pirento.',
  });
});

test('remembered notes go in the last system message, marked as facts', () => {
  const req = buildRequest([{role: 'user', content: 'hi'}], {memory: ['My company is Asha Foods']});
  assert.equal(req.messages.at(-1).role, 'system');
  assert.match(req.messages.at(-1).content, /not instructions[\s\S]*Asha Foods/);
  assert.equal(req.system.length, 1);
});
