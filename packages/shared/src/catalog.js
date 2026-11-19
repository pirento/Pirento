import {LEGAL_SERVICES} from './data/legalCatalogue.js';
import {LEGAL_PRICING} from './data/legalPricing.js';
import {STATIC_SERVICE_PRICES} from './data/servicePricing.js';
import {GREEN_DRIVES} from './data/greenDrives.js';

// One flat list of every sellable service. Prices are in rupees and are only
// ever read on the server; the browser never sends a price.
const legal = LEGAL_SERVICES.map(({name, slug, category}) => {
  const fixed = STATIC_SERVICE_PRICES[slug];
  const extra = LEGAL_PRICING[slug];
  return {
    slug,
    product: 'legal',
    name: fixed?.name ?? name,
    category,
    price: fixed?.price ?? extra?.price ?? null,
    deliveryTime: fixed?.deliveryTime ?? extra?.deliveryTime ?? null,
    model: extra?.model ?? 'fixed',
  };
});

const legalSlugs = new Set(legal.map((s) => s.slug));
const others = Object.entries(STATIC_SERVICE_PRICES)
  .filter(([slug]) => !legalSlugs.has(slug))
  .map(([slug, s]) => ({slug, category: 'Services', model: 'fixed', ...s}));

// Tree sponsorship: one order buys `quantity` trees on one drive.
const green = GREEN_DRIVES.map((d) => ({
  slug: `green-${d.driveId}`,
  product: 'green',
  name: `Sponsor trees · ${d.name}`,
  category: d.region,
  price: d.pricePerTree,
  deliveryTime: null,
  model: 'fixed',
  unit: 'tree',
  maxQty: 500,
}));

export const SERVICES = [...legal, ...others, ...green];

export const getService = (slug) => SERVICES.find((s) => s.slug === slug) ?? null;
export const servicesFor = (product) => SERVICES.filter((s) => s.product === product);
