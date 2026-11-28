// One flat list of every sellable service. Prices are in rupees and are only
// ever read on the server; the browser never sends a price.
import {LEGAL_SERVICES} from '../data/legalCatalogue.js';
import {LEGAL_PRICING} from '../data/legalPricing.js';
import {STATIC_SERVICE_PRICES} from '../data/servicePricing.js';
import {GREEN_DONATION, GREEN_DRIVES} from '../data/greenDrives.js';
import {GIFT_BOXES} from '../data/giftBoxes.js';
import {LEGAL_PAGES} from '../data/legalPages.js';

const cheapest = (packages) => Math.min(...packages.map((p) => p.price));

const legal = LEGAL_SERVICES.map(({name, slug, category}) => {
  const fixed = STATIC_SERVICE_PRICES[slug];
  const extra = LEGAL_PRICING[slug];
  const packages = LEGAL_PAGES[slug]?.packages;
  return {
    slug,
    product: 'legal',
    name: fixed?.name ?? name,
    category,
    // With packages, the service sells "from" its cheapest one.
    price: packages ? cheapest(packages) : (fixed?.price ?? extra?.price ?? null),
    ...(packages && {packages}),
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
green.push({
  slug: GREEN_DONATION.slug,
  product: 'green',
  name: GREEN_DONATION.name,
  category: 'Donation',
  price: GREEN_DONATION.pricePerTree,
  deliveryTime: null,
  model: 'fixed',
  unit: 'tree',
  maxQty: 500,
  description: 'Trees planted on a Pirento Green drive as a gift to the planet. They grow no carbon credits for you.',
});

const giftox = GIFT_BOXES.map((b) => ({
  slug: `giftox-${b.boxId}`,
  product: 'giftox',
  name: b.name,
  category: b.category,
  price: b.price,
  deliveryTime: null,
  model: 'fixed',
  unit: 'box',
  maxQty: 50,
  description: b.description,
  items: b.items,
}));

export const SERVICES = [...legal, ...others, ...green, ...giftox];

export const getService = (slug) => SERVICES.find((s) => s.slug === slug) ?? null;
export const servicesFor = (product) => SERVICES.filter((s) => s.product === product);

/**
 * The admin's layer over the catalogue (kept by the catalog service, one row per slug): a new price or off sale,
 * the service's own questions before and after payment, and for a service made in admin, the whole service.
 */
export function applyEdit(service, edit) {
  if (!service || !edit) return service;
  const s = {...service};
  if (edit.questions) s.questions = edit.questions;
  if (edit.afterQuestions) s.afterQuestions = edit.afterQuestions;
  if (edit.packages) s.packages = edit.packages;
  else if (edit.price && s.packages?.length) {
    // A plain price change on a service with packages moves its cheapest package, the "from" price.
    const low = s.packages.reduce((a, b) => (b.price < a.price ? b : a));
    s.packages = s.packages.map((p) => (p === low ? {...p, price: edit.price} : p));
  }
  if (edit.offSale) s.price = null;
  else if (s.packages?.length) s.price = cheapest(s.packages);
  else if (edit.price) s.price = edit.price;
  return s;
}

/**
 * The packages a service sells, cheapest first. A service without its own packages sells one, at its price, so
 * checkout and orders always work with a package.
 */
export function packagesOf(service) {
  if (!service?.price) return [];
  const list = service.packages?.length
    ? service.packages
    : [
        {
          id: 'standard',
          name: 'Standard',
          price: service.price,
          deliveryTime: service.deliveryTime ?? '',
          includes: service.includes ?? [],
        },
      ];
  return [...list].sort((a, b) => a.price - b.price);
}

/** The package bought: the one asked for by id, or the cheapest when none is named. Null for an unknown id. */
export function packageOf(service, id) {
  const list = packagesOf(service);
  return (id ? list.find((p) => p.id === id) : list[0]) ?? null;
}

/** The sections of a service's page. Admin's text wins section by section; an empty list hides a section. */
export const PAGE_SECTIONS = [
  'intro',
  'whoFor',
  'included',
  'notIncluded',
  'documents',
  'steps',
  'timeline',
  'costs',
  'deliverables',
  'mistakes',
  'benefits',
  'faqs',
];
export function servicePage(slug, pageEdit) {
  const base = LEGAL_PAGES[slug]?.page ?? {};
  return {
    ...Object.fromEntries(PAGE_SECTIONS.map((k) => [k, pageEdit?.[k] ?? base[k] ?? (k === 'intro' ? '' : [])])),
    // Admin's picture choices by section ({scene, caption, image}); a section not listed shows its default.
    art: pageEdit?.art ?? {},
  };
}

/** The sections of a service page that carry a picture, and the scene each shows unless admin picks another. */
export const ART_SECTIONS = {
  overview: 'office',
  ready: 'meeting',
  how: 'filing',
  plan: 'calendar',
  costs: 'costs',
  deliverables: 'handover',
  benefits: 'growth',
  faq: 'questions',
};

/** Every scene the web app can draw (components/Illustration.jsx and illustrations/). */
export const ART_SCENES = [
  'office',
  'meeting',
  'search',
  'filing',
  'calendar',
  'costs',
  'handover',
  'questions',
  'growth',
  'helpdesk',
  'signin',
  'ledger',
  'planting',
  'classroom',
  'assistant',
  'vault',
  'partners',
  'loan',
  'idcheck',
  'delivery',
  'justice',
  'signing',
  'gstportal',
  'carbonmarket',
  'taskboard',
  'summary',
  'cloudfiles',
  'commission',
  'waitlist',
  'consent',
  'unboxing',
  'lawbook',
  'invoice',
  'earth',
  'gradcap',
  'chip',
  'keyring',
  'megaphone',
  'coins',
  'qrcard',
  'balloons',
  'saplings',
  'ration',
  'schoolbag',
  'healthcamp',
  'liftdoors',
  'mop',
  'sofa',
  'ring',
  'carehands',
  'document',
  'certificate',
  'chat',
  'lock',
  'network',
  'chart',
  'id',
  'gift',
  'leaf',
  'ecosystem',
];

// A service made in admin: its slug starts with its product's (legal-startup-pack), so any page can tell whose it is.
const madeInAdmin = (slug, edit) =>
  edit?.custom ? {model: 'fixed', deliveryTime: null, includes: [], ...edit.custom, slug, custom: true} : null;

/** One service as it sells now, from the base catalogue or made in admin, with the admin's edits. */
export const editedService = (slug, edits) =>
  applyEdit(getService(slug) ?? madeInAdmin(slug, edits[slug]), edits[slug]);

/** A product's services as they sell now: the base catalogue, then the ones made in admin. */
export const editedServicesFor = (product, edits) =>
  [
    ...servicesFor(product),
    ...Object.entries(edits)
      .filter(([, e]) => e.custom?.product === product)
      .map(([slug, e]) => madeInAdmin(slug, e)),
  ].map((s) => applyEdit(s, edits[s.slug]));

/** The price a service goes back to on "Reset": the catalogue's, or the one it was made with in admin. */
export const basePrice = (slug, edits) => getService(slug)?.price ?? edits[slug]?.custom?.price ?? null;

/** Categories in the order to show them: Legal's own areas of law first, then any new ones made in admin. */
export function categoriesOf(services, first = []) {
  const names = [...first, ...services.map((s) => s.category)];
  return [...new Set(names)].filter((c) => services.some((s) => s.category === c));
}

/** Lowercase words joined by hyphens: the slug of a name, and the anchor of a category. */
export const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 60);
