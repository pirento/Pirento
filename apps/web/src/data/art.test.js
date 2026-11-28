// Every picture on the site is used in one place only: the service page template's eight, each product's home card,
// each product home's two,
// the other pages' own, the sign-in panel's and the About page's Foundation picture.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ART_SCENES, ART_SECTIONS} from '@pirento/shared';
import {processArt, productArt, productCardArt, productIllustration} from './site.js';

test('no picture is used in two places', () => {
  const used = [
    ...Object.values(ART_SECTIONS),
    ...Object.values(productIllustration),
    ...Object.values(productCardArt),
    ...Object.values(productArt).flatMap((parts) => Object.values(parts).map((p) => p.scene)),
    ...Object.values(processArt).map((p) => p.scene),
    'signin', // the sign-in panel (features/auth/AuthShell.jsx)
    'leaf', // the Foundation in the family rows on the home page (features/about/FamilyRows.jsx; About hides it)
  ];
  const twice = used.filter((s, i) => used.indexOf(s) !== i);
  assert.deepEqual(twice, [], `used more than once: ${twice.join(', ')}`);
  for (const s of used) assert.ok(ART_SCENES.includes(s), `${s} is not a scene the site draws`);
});
