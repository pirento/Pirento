// What the browser and every service may import from '@pirento/shared'.
// Nothing here touches Node APIs or secrets: server-only helpers live in
// '@pirento/shared/server', and exam answers in '@pirento/shared/exam'.

// Products and the services they sell
export {PRODUCTS, getProduct} from './data/products.js';
export {BRAND, PRODUCT_COLOURS} from './data/brand.js';
export {LEGAL_CATALOGUE, legalServiceSlug} from './data/legalCatalogue.js';
export {SERVICES, getService, servicesFor} from './catalog/services.js';

// Orders: life cycle and checkout questions
export {ORDER_STEPS, STAFF_TRANSITIONS, statusLabel, checkoutQuestions, validateIntake} from './orders/rules.js';

// Bharat ID: number format and the application form
export {bharatIdFromSeq, isBharatId, formatBharatId, verhoeffCheckDigit} from './identity/bharatId.js';
export {ID_SECTIONS, RELATIONS, validateSection} from './identity/form.js';

// Money helpers
export {emi} from './money/emi.js';
export {EXAM_RULES, VAULT_LIMITS} from './data/examRules.js';
export {GREEN_DRIVES} from './data/greenDrives.js';
export {TERMS_VERSION, MIN_PASSWORD, toPhone, maskPhone, isUsername, passwordProblem} from './account/rules.js';
