// Tests for brand.js.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {BRAND, PANEL_COLOURS, PRODUCT_COLOURS, contrast, textOn} from './brand.js';

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

test("every brand panel reads: its text, quieter text and highlight on its field, and the action's text", () => {
  for (const [name, c] of Object.entries(PANEL_COLOURS)) {
    for (const t of [c.ink, c.muted, c.highlight]) assert.ok(contrast(t, c.paper) >= 4.5, `${name} ${t}`);
    assert.ok(contrast(c.onAccent, c.accent) >= 4.5, `${name} action`);
  }
});
