// Browser-safe exports only. Server helpers live in '@pirento/shared/server'.
export {PRODUCTS, getProduct} from './data/products.js';
export {LEGAL_CATALOGUE, legalServiceSlug} from './data/legalCatalogue.js';
export {SERVICES, getService, servicesFor} from './catalog.js';
export {ORDER_STEPS, STAFF_TRANSITIONS, statusLabel, checkoutQuestions, validateIntake} from './orders.js';
export {bharatIdFromSeq, isBharatId, formatBharatId} from './bharatId.js';
export {emi} from './emi.js';
