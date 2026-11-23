// Tests for lessonText.js.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {blocks, inline} from './lessonText.js';

test('headings, lists, code, images and paragraphs', () => {
  const b = blocks(
    '# Title\n\nFirst line\nsame paragraph\n\n- one\n- two\n1. a\n```\nx = 1\n```\n![chart](https://ex.com/a.png)\n![bad](javascript:alert(1))',
  );
  // The javascript: image is not an image: it stays as plain text, never a src.
  assert.deepEqual(
    b.map((x) => x.type),
    ['h', 'p', 'ul', 'ol', 'code', 'img', 'p'],
  );
  assert.equal(b.filter((x) => x.type === 'img').length, 1);
  assert.equal(b[1].text, 'First line same paragraph');
  assert.deepEqual(b[2].items, ['one', 'two']);
  assert.equal(b[4].text, 'x = 1');
});

test('inline bold, code and only http(s) links', () => {
  assert.deepEqual(inline('a **b** `c` [d](https://e.com) [x](javascript:y)'), [
    {t: 'text', v: 'a '},
    {t: 'b', v: 'b'},
    {t: 'text', v: ' '},
    {t: 'code', v: 'c'},
    {t: 'text', v: ' '},
    {t: 'a', v: 'd', href: 'https://e.com'},
    {t: 'text', v: ' '},
    {t: 'text', v: 'x'},
  ]);
});
