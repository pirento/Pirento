import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PRODUCTS} from './products.js';

// WCAG relative luminance contrast.
const lum = (hex) => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

test('every product site has a brand colour whose button text passes AA', () => {
  for (const p of PRODUCTS) {
    assert.match(p.color, /^#[0-9A-F]{6}$/i, p.slug);
    assert.ok(contrast(p.color, p.onColor) >= 4.5, `${p.slug}: ${contrast(p.color, p.onColor).toFixed(2)}`);
    assert.ok(p.steps.length >= 3 && p.faq.length >= 2 && p.pill, p.slug);
  }
});
