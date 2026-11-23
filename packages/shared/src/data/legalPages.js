// Every Pirento Legal service's page, by area: packages (featured ones) and the page sections (servicePage).
import {FEATURED} from './legalPages/featured.js';
import {SETUP} from './legalPages/setup.js';
import {LICENCES} from './legalPages/licences.js';
import {TAX} from './legalPages/tax.js';
import {COMPLIANCE} from './legalPages/compliance.js';
import {IPR} from './legalPages/ipr.js';
import {DOCUMENTS} from './legalPages/documents.js';
import {LABOUR} from './legalPages/labour.js';
import {CONSULT} from './legalPages/consult.js';

export const LEGAL_PAGES = {
  ...SETUP,
  ...LICENCES,
  ...TAX,
  ...COMPLIANCE,
  ...IPR,
  ...DOCUMENTS,
  ...LABOUR,
  ...CONSULT,
  ...FEATURED,
};
