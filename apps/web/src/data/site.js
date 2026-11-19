import {PRODUCTS, SERVICES, LEGAL_CATALOGUE} from '@pirento/shared';

// All site copy lives here; components only render it.

export const brand = {
  name: 'Pirento',
  legalName: 'Pirento Ecosystem Pvt. Ltd.',
  cin: 'U63121UP2023PTC188021',
  email: 'hello@pirento.com',
  supportEmail: 'support@pirento.com',
  status: 'Legal services open',
  motto: 'One account. Every record in one place.',
};

export const nav = [
  {label: 'Home', to: '/'},
  {label: 'Products', to: '/products'},
  {label: 'Legal', to: '/legal'},
  {label: 'Verify', to: '/verify'},
  {label: 'Support', to: '/support'},
];

// Where each product's "Open" button goes. Products without one show only their page.
export const productApps = {
  legal: '/legal',
  black: '/products/black#services',
  green: '/products/green#services',
  intern: '/intern',
  vault: '/vault',
  'bharat-id': '/bharat-id',
  ai: '/ai',
  one: '/one',
  capital: '/capital',
  giftox: '/products/giftox#services',
};

export const socials = [
  {name: 'X (Twitter)', href: 'https://x.com/pirento', icon: 'twitter'},
  {name: 'LinkedIn', href: 'https://www.linkedin.com/company/pirento', icon: 'linkedin'},
  {name: 'Instagram', href: 'https://www.instagram.com/pirento_', icon: 'instagram'},
];

const priced = SERVICES.filter((s) => s.price);

// Counted from the catalog itself, so these numbers are always true.
export const stats = [
  {value: String(PRODUCTS.length), label: 'products on one account'},
  {value: String(SERVICES.filter((s) => s.product === 'legal').length), label: 'legal services listed'},
  {value: String(LEGAL_CATALOGUE.length), label: 'legal categories'},
  {value: `₹${Math.min(...priced.map((s) => s.price))}`, label: 'lowest fixed price'},
];

export const home = {
  title: 'One account. / Ten products. / Every record kept.',
  highlight: 'One account.',
  intro:
    'Pirento brings <strong>legal work, tax filing, identity, storage and learning</strong> under one sign-in and one wallet. You see what we do for you, step by step.',
  ecosystem: {
    label: 'Ecosystem',
    title: 'Ten products. / One sign-in.',
    intro: 'Each product does one job well. Your account, wallet and identity carry across all of them.',
  },
  how: {
    label: 'How it works',
    title: 'Simple from / the first click.',
    steps: [
      {title: 'Pick a service', body: 'Browse the catalog. Every price is shown before you start.'},
      {title: 'Sign in with email', body: 'A 6-digit code, no password to remember.'},
      {title: 'Share your details', body: 'Our team picks up the work and keeps you updated.'},
      {title: 'Track every step', body: 'Orders, payments and documents stay in your account.'},
    ],
  },
  legal: {
    label: 'Pirento Legal',
    title: 'Legal work, / priced up front.',
    intro:
      'Company registration, licences, GST, ITR and trademark work. Fixed price where the work is fixed; a paid consultation where it depends on your matter.',
  },
  numbers: {label: 'In numbers', title: 'Counted, / not claimed.'},
  faq: {
    label: 'Questions',
    title: 'Before you / begin.',
    items: [
      {
        q: 'Do I need a separate account for each product?',
        a: 'No. One Pirento account works across every product, with one wallet and one identity.',
      },
      {
        q: 'How do I sign in?',
        a: 'Enter your email and we send a 6-digit code. There is no password to remember.',
      },
      {
        q: 'Why do some legal services say "consultation"?',
        a: 'For litigation, advisory and immigration work the cost depends on your matter. You book a paid consultation and we quote the full fee after it.',
      },
      {
        q: 'Which products can I use today?',
        a: 'Products marked "Now" are open. Products marked "Expected" are being built and say clearly what is not available yet.',
      },
      {
        q: 'Is Bharat ID a government ID?',
        a: 'No. Bharat ID is a Pirento application identifier. It is not a government identity credential.',
      },
    ],
  },
  contact: {
    label: 'Contact',
    title: 'Have a matter? / Let’s talk.',
  },
};

export const productIllustration = {
  legal: 'document',
  black: 'document',
  green: 'leaf',
  intern: 'certificate',
  ai: 'chat',
  vault: 'lock',
  one: 'network',
  capital: 'chart',
  'bharat-id': 'id',
  giftox: 'gift',
};
