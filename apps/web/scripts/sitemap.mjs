// Writes public/sitemap.xml from the catalog, so every product and service page is listed.
import {writeFileSync} from 'node:fs';
import {PRODUCTS, SERVICES} from '@pirento/shared';

const SITE = 'https://pirento.com';
const paths = [
  '/',
  '/products',
  '/legal',
  '/verify',
  '/intern',
  '/capital',
  ...PRODUCTS.map((p) => `/products/${p.slug}`),
  ...SERVICES.map((s) => `/services/${s.slug}`),
];
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${paths.map((p) => `  <url><loc>${SITE}${p}</loc></url>`).join('\n')}
</urlset>
`;
writeFileSync(new URL('../public/sitemap.xml', import.meta.url), xml);
console.log(`sitemap.xml: ${paths.length} URLs`);
