// Tests for brand.js.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {BRAND, FOUNDATION_COLOURS, PRODUCT_COLOURS, contrast, textOn} from './brand.js';

test('contrast matches known WCAG values', () => {
  assert.equal(Math.round(contrast('#FFFFFF', '#000000')), 21);
  assert.ok(contrast(BRAND.accent, '#FFFFFF') >= 4.5); // master red buttons carry white text
});

test('every accent gets a text colour that reaches AA', () => {
  for (const [slug, c] of Object.entries(PRODUCT_COLOURS)) {
    assert.ok(contrast(c.accent, textOn(c.accent, c.dark)) >= 4.5, slug);
    assert.ok(contrast(c.dark, '#FFFFFF') >= 4.5, `${slug} dark fields carry white text`);
  }
});

test("the Foundation's cream, soft blue and yellow all read on its blue", () => {
  const {dark, accent, cream, soft} = FOUNDATION_COLOURS;
  for (const c of [accent, cream, soft]) assert.ok(contrast(c, dark) >= 4.5, c);
});
