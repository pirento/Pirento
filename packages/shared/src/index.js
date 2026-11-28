// What the browser and every service may import from '@pirento/shared'.
// Nothing here touches Node APIs or secrets: server-only helpers live in
// '@pirento/shared/server', and exam answers in '@pirento/shared/exam'.

// Products and the services they sell
export {PRODUCTS, getProduct} from './data/products.js';
export {BRAND, PANEL_COLOURS, PRODUCT_COLOURS} from './data/brand.js';
export {LEGAL_CATALOGUE, legalServiceSlug} from './data/legalCatalogue.js';
export {
  SERVICES,
  getService,
  servicesFor,
  applyEdit,
  editedService,
  editedServicesFor,
  basePrice,
  categoriesOf,
  slugify,
  packagesOf,
  packageOf,
  servicePage,
  PAGE_SECTIONS,
  ART_SECTIONS,
  ART_SCENES,
} from './catalog/services.js';
export {LEGAL_PAGES} from './data/legalPages.js';

// Orders: life cycle and checkout questions
export {
  ORDER_STEPS,
  STAFF_TRANSITIONS,
  FULFILMENT,
  statusLabel,
  checkoutQuestions,
  serviceQuestions,
  askedQuestions,
  needsDetails,
  FIXED_QUESTION_IDS,
  checkAnswers,
  validateIntake,
  validateFulfilment,
} from './orders/rules.js';

// Bharat ID: number format and the application form
export {bharatIdFromSeq, isBharatId, formatBharatId, verhoeffCheckDigit} from './identity/bharatId.js';
export {CHANGEABLE_SECTIONS, ID_SECTIONS, RELATIONS, validateFields, validateSection} from './identity/form.js';
export {
  BUSINESS_PROFILE,
  BUSINESS_REQUEST,
  BUSINESS_TYPES,
  CONSENT_FIELDS,
  ENTITY_TYPES,
  SANDBOX_AUTH,
  TEST_BHARAT_IDS,
} from './identity/business.js';
export {AUTH_METHODS, authMethod, pinProblem} from './identity/authMethods.js';
export {KYC_DONE, KYC_FAILED, declarationSigned, kycDone, kycFailed} from './identity/verification.js';

// Money helpers
export {emi} from './money/emi.js';
export {EXAM_RULES, VAULT_LIMITS} from './data/examRules.js';
export {
  VAULT_KINDS,
  vaultKind,
  validateRecord,
  LEGACY,
  quietStage,
  DEATH_ISSUERS,
  deathIssuer,
  namesMatch,
} from './data/vault.js';
export {PROGRAM_MONTHS, PROGRAM_SCORE, PROGRAM_PASS, gradeFor, finalMark} from './data/internProgram.js';
export {GREEN_DONATION, GREEN_DRIVES} from './data/greenDrives.js';
export {greenCertNo, hasGreenCert, isDonation, parseGreenRef} from './orders/greenCertificate.js';
export {TERMS_VERSION, MIN_PASSWORD, toPhone, maskPhone, isUsername, passwordProblem} from './account/rules.js';
