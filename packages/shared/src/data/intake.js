// Questions asked before checkout. Legal has its own set; other products get a base set plus one extra.
// Intake questionnaire shown before paying for a Pirento Legal service.
// 3–5 questions: a shared base plus optional service-specific extras.

export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Delhi',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Other / Union Territory',
];

const LEGAL_BASE = [
  {
    id: 'applicantType',
    label: 'Who is this service for?',
    options: ['Just me (individual)', 'A new startup', 'A running business', 'A large organisation'],
  },
  {
    id: 'state',
    label: 'Which state are you based in?',
    help: 'Filings are routed to the right jurisdiction.',
    options: INDIAN_STATES,
  },
  {
    id: 'urgency',
    label: 'How soon do you need this done?',
    options: ['Standard timeline', 'As fast as possible', 'Just exploring for now'],
  },
  {
    id: 'existingSetup',
    label: 'Do you already have any registrations?',
    options: ['None yet', 'GST registered', 'Registered company / LLP', 'Both GST and company'],
  },
];

// One extra, service-specific question (keeps the total at 5).
const SERVICE_EXTRAS = {
  'private-limited-company': {
    id: 'directors',
    label: 'How many directors will the company have?',
    options: ['2 directors', '3–5 directors', 'More than 5'],
  },
  'llp-registration': {
    id: 'partners',
    label: 'How many partners will the LLP have?',
    options: ['2 partners', '3–5 partners', 'More than 5'],
  },
  'gst-registration': {
    id: 'turnover',
    label: 'What is your expected annual turnover?',
    options: ['Under ₹20 lakh', '₹20–40 lakh', '₹40 lakh – 1.5 crore', 'Above ₹1.5 crore'],
  },
  'trademark-registration': {
    id: 'brandName',
    label: 'What name or logo do you want to protect?',
    placeholder: 'e.g. "Pirento" wordmark and logo',
  },
  'itr-filing': {
    id: 'incomeSources',
    label: 'What are your income sources?',
    options: ['Salary only', 'Salary + investments', 'Business / freelance', 'Multiple sources'],
  },
  'legal-notice': {
    id: 'disputeType',
    label: 'What is the notice about?',
    options: ['Unpaid dues / money recovery', 'Contract breach', 'Employment issue', 'Something else'],
  },
};

function legalQuestions(serviceId) {
  const extra = SERVICE_EXTRAS[serviceId];
  return extra ? [...LEGAL_BASE, extra] : LEGAL_BASE;
}

// Universal pre-checkout questionnaire: legal keeps its detailed set, every
// other product gets a base set plus one product-specific question.

const BASE_QUESTIONS = [
  {
    id: 'whoFor',
    label: 'Who is this for?',
    options: ['Just me', 'My team or business', 'A client I work with', 'A gift for someone'],
  },
  {
    id: 'timeline',
    label: 'When do you need it?',
    options: ['As soon as possible', 'Within a few weeks', 'Flexible — just exploring'],
  },
  {
    id: 'requirements',
    label: 'Tell us briefly what you need',
    placeholder: 'A line or two about your requirement…',
  },
];

const PRODUCT_EXTRAS = {
  giftox: {
    id: 'occasion',
    label: 'What is the occasion?',
    options: ['Employee onboarding', 'Festival gifting', 'Client appreciation', 'Personal celebration'],
  },
  green: {
    id: 'scale',
    label: 'What scale are you thinking?',
    options: [
      'A few trees (personal)',
      '50–500 trees (team/CSR)',
      '500+ trees (corporate drive)',
      'Carbon credits only',
    ],
  },
  intern: {
    id: 'track',
    label: 'Which track interests you?',
    options: ['Technology & data', 'Finance & accounting', 'Legal & compliance', 'Marketing & design'],
  },
  ai: {
    id: 'useCase',
    label: 'What should the AI work on?',
    options: ['Document processing', 'Customer support automation', 'Data analytics', 'Something custom'],
  },
  vault: {
    id: 'storage',
    label: 'What will you store?',
    options: ['Personal documents', 'Business records', 'Passwords & credentials', 'Legacy / nominee planning'],
  },
  capital: {
    id: 'role',
    label: 'How do you want to participate?',
    options: ['Borrow for my business', 'Borrow personally', 'Lend and earn returns'],
  },
  one: {
    id: 'partnership',
    label: 'What kind of partnership?',
    options: ['Individual reseller', 'Agency / consultancy', 'Corporate channel partner'],
  },
  black: {
    id: 'practice',
    label: 'What describes you best?',
    options: ['Individual filer', 'Business owner', 'CA / tax professional', 'Accounting firm'],
  },
  'bharat-id': {
    id: 'purpose',
    label: 'What do you need verified identity for?',
    options: ['Personal KYC across Pirento', 'Business verification', 'Team onboarding'],
  },
};

/** Question set for the checkout pages, by product (legal keeps its own). */
export function intakeQuestions(product, serviceId) {
  if (product === 'legal') return legalQuestions(serviceId ?? '');
  const extra = PRODUCT_EXTRAS[product];
  return extra ? [extra, ...BASE_QUESTIONS] : BASE_QUESTIONS;
}
