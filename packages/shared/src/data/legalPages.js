// Every Pirento Legal service's page, by area: packages and the page sections (servicePage). The featured ten have
// their own packages; every other priced service gets three by rule (tiers), and each area's extra questions,
// mistakes and benefits (more/) are added to its sections.
import {STATIC_SERVICE_PRICES} from './servicePricing.js';
import {LEGAL_PRICING} from './legalPricing.js';
import {FEATURED} from './legalPages/featured.js';
import {SETUP} from './legalPages/setup.js';
import {LICENCES} from './legalPages/licences.js';
import {TAX} from './legalPages/tax.js';
import {COMPLIANCE} from './legalPages/compliance.js';
import {IPR} from './legalPages/ipr.js';
import {DOCUMENTS} from './legalPages/documents.js';
import {LABOUR} from './legalPages/labour.js';
import {CONSULT} from './legalPages/consult.js';
import {tiers} from './legalPages/common.js';
import {MORE_SETUP} from './legalPages/more/setup.js';
import {MORE_TAX} from './legalPages/more/tax.js';
import {MORE_COMPLIANCE} from './legalPages/more/compliance.js';
import {MORE_IPR} from './legalPages/more/ipr.js';
import {MORE_DOCUMENTS} from './legalPages/more/documents.js';
import {MORE_LABOUR} from './legalPages/more/labour.js';
import {MORE_CONSULT} from './legalPages/more/consult.js';
import {GENERAL, MORE_FEATURED} from './legalPages/more/featured.js';

const MORE = {
  ...MORE_SETUP,
  ...MORE_TAX,
  ...MORE_COMPLIANCE,
  ...MORE_IPR,
  ...MORE_DOCUMENTS,
  ...MORE_LABOUR,
  ...MORE_CONSULT,
  ...MORE_FEATURED,
};

// Fill a list up to three from general lines it does not already have.
const toThree = (list, general, same) => [
  ...list,
  ...general.filter((g) => !list.some((x) => same(x, g))).slice(0, Math.max(0, 3 - list.length)),
];

/** A page with its area's extra lines added after its own (f: questions, m: mistakes, b: benefits). */
function deepen(page, more = {}) {
  const mistakes = [...page.mistakes, ...(more.m ?? [])];
  const benefits = [...page.benefits, ...(more.b ?? []).map(([title, body]) => ({title, body}))];
  return {
    ...page,
    faqs: [...page.faqs, ...(more.f ?? []).map(([q, a]) => ({q, a}))],
    mistakes: toThree(mistakes, GENERAL.m, (a, b) => a === b),
    benefits: toThree(
      benefits,
      GENERAL.b.map(([title, body]) => ({title, body})),
      (a, b) => a.title === b.title,
    ),
  };
}

const BY_AREA = {...SETUP, ...LICENCES, ...TAX, ...COMPLIANCE, ...IPR, ...DOCUMENTS, ...LABOUR, ...CONSULT};

export const LEGAL_PAGES = {
  ...Object.fromEntries(
    Object.entries(BY_AREA).map(([slug, entry]) => {
      const page = deepen(entry.page, MORE[slug]);
      const priced = {...LEGAL_PRICING[slug], ...STATIC_SERVICE_PRICES[slug]};
      // The 30-minute calls are consultations even where their price row does not say so.
      if (slug.startsWith('talk-to-')) priced.model = 'consult';
      return [slug, {...entry, page, ...(!entry.packages && priced.price && {packages: tiers(priced, page.included)})}];
    }),
  ),
  ...Object.fromEntries(
    Object.entries(FEATURED).map(([slug, entry]) => [slug, {...entry, page: deepen(entry.page, MORE[slug])}]),
  ),
};
