import {test} from 'node:test';
import assert from 'node:assert/strict';
import {httpUrl} from './urls.js';

test('only http and https links pass', () => {
  assert.ok(httpUrl().safeParse('https://example.com/x').success);
  assert.ok(!httpUrl().safeParse('javascript:alert(1)').success);
  assert.ok(!httpUrl().safeParse('data:text/html,hi').success);
});
