// Tests for tools.js.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {runTool} from './tools.js';

test('reads only the signed-in person, from the area asked', async () => {
  const calls = [];
  const fake = async (url, path, body) => (calls.push({url, path, body}), {balanceRupees: 5});
  const out = await runTool('my_account', {area: 'wallet', userId: 'someone-else'}, 'me', fake);
  assert.equal(out.content, '{"balanceRupees":5}');
  assert.deepEqual(calls[0].body, {userId: 'me'});
  assert.equal(calls[0].path, '/internal/assistant');
});

test('unknown tools and areas, and failures, come back as errors', async () => {
  assert.equal((await runTool('rm', {}, 'me')).is_error, true);
  assert.equal((await runTool('my_account', {area: 'vault'}, 'me')).is_error, true);
  const down = async () => {
    throw new Error('down');
  };
  assert.equal((await runTool('my_account', {area: 'orders'}, 'me', down)).is_error, true);
});

test('a ticket is opened for the signed-in person only', async () => {
  const calls = [];
  const fake = async (url, path, body) => (calls.push({path, body}), {ticketNo: 10000001, link: '/support/x'});
  const out = await runTool(
    'open_support_ticket',
    {subject: 'Late order', message: 'Order 100 is late', userId: 'x'},
    {userId: 'me', email: 'me@example.com', product: 'legal'},
    fake,
  );
  assert.equal(calls[0].path, '/internal/tickets');
  assert.deepEqual(calls[0].body, {
    userId: 'me',
    email: 'me@example.com',
    subject: 'Late order',
    message: 'Order 100 is late',
    product: 'legal',
  });
  assert.match(out.content, /10000001/);
});
