import {PRODUCTS, SERVICES, LEGAL_CATALOGUE} from '@pirento/shared';

// All site copy lives here; components only render it.

export const brand = {
  name: 'Pirento',
  // Pirento Ecosystem is a brand; the company behind it is Venturecore.
  legalName: 'Venturecore Solutions Private Limited',
  cin: 'U63121UP2023PTC188021',
  gstin: '09AAJCV6240P1ZL',
  email: 'hello@pirento.com',
  supportEmail: 'support@pirento.com',
  status: 'Legal services open',
  motto: 'One account. Every record in one place.',
};

export const nav = [
  {label: 'Home', to: '/'},
  {label: 'Products', to: '/products'},
  {label: 'About', to: '/about'},
  {label: 'Legal', to: '/legal'},
  {label: 'Verify', to: '/verify'},
  {label: 'Support', to: '/support'},
];

// The footer's link columns. Product sites swap the first column for their own links.
export const footer = {
  company: [
    {label: 'About us', to: '/about'},
    {label: 'The Pirento family', to: '/about#family'},
    {label: 'Support', to: '/support'},
    {label: 'Verify a record', to: '/verify'},
  ],
  legal: [
    {label: 'Terms and Conditions', to: '/terms'},
    {label: 'Privacy Policy', to: '/privacy'},
    {label: 'Refunds and cancellations', to: '/refunds'},
  ],
  note: 'Pirento Ecosystem is our brand. Business partner of Vakilsearch.',
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
  pillars: {
    label: 'One account',
    title: 'Sign in once. / It all comes along.',
    items: [
      {
        title: 'One sign-in',
        body: 'An emailed 6-digit code opens every Pirento site. No password to forget.',
        to: '/login',
        cta: 'Sign in',
      },
      {
        title: 'One wallet',
        body: 'Pay for Legal, Black, Green and Giftox from the same balance, in paise, with every move on record.',
        to: '/dashboard',
        cta: 'Open the wallet',
      },
      {
        title: 'One identity',
        body: 'Bharat ID: reviewed once by our team, with a public page anyone can check.',
        to: '/bharat-id',
        cta: 'About Bharat ID',
      },
    ],
  },
  ecosystem: {
    label: 'Ecosystem',
    title: 'Ten products, / grouped by need.',
    intro: 'Each product does one job well. Your account, wallet and identity carry across all of them.',
    // How the products are grouped on the home page. Every product appears once.
    groups: [
      {title: 'Paperwork and compliance', body: 'Registrations, filings and legal help.', products: ['legal', 'black']},
      {title: 'Identity and safekeeping', body: 'Who you are, and what you keep.', products: ['bharat-id', 'vault']},
      {
        title: 'Learn, refer, plan',
        body: 'Certificates, referrals and loan planning.',
        products: ['intern', 'one', 'capital'],
      },
      {title: 'Give', body: 'Trees on a drive, boxes at a door.', products: ['green', 'giftox']},
      {title: 'Ask', body: 'Not sure where to start? Ask in your words.', products: ['ai']},
    ],
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

// The sign-in pages. Product sites use their own quote and overview from packages/shared instead.
export const login = {
  ecosystem: {
    eyebrow: 'Pirento Ecosystem',
    quote: 'One account. Every record in one place.',
    line: 'Sign in once to use your orders, wallet and ID.',
  },
  staff: {
    eyebrow: 'Pirento Admin',
    quote: 'The console for the Pirento team.',
    line: 'Staff ID and password only. Every sign-in attempt is logged.',
  },
};

// The Terms and Conditions at /terms. Sections 1–5 come from the earlier Pirento site; 6 and 7 describe how
// accounts here actually work. Bump TERMS_VERSION (packages/shared/src/account/rules.js) whenever this changes.
export const terms = {
  updated: '20 November 2026',
  sections: [
    {
      title: 'Agreement to terms',
      body: [
        'These Terms and Conditions are a legally binding agreement between you, whether personally or on behalf of an entity ("you"), and Venturecore Solutions Private Limited, which runs the Pirento Ecosystem brand ("Pirento", "we", "us" or "our"), about your access to and use of our websites and any related media, mobile website or app (together, the "Site").',
      ],
    },
    {
      title: 'Intellectual property',
      body: [
        'Unless stated otherwise, the Site is our property. Its source code, databases, functions, software, designs, audio, video, text, photographs and graphics (the "Content") and the trademarks, service marks and logos on it (the "Marks") are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws.',
      ],
    },
    {
      title: 'What you confirm',
      list: [
        'All the information you give when you create an account is true, accurate, current and complete.',
        'You will keep that information accurate and update it when it changes.',
        'You have the legal capacity to agree to these terms, and you will follow them.',
        'You will not use the Site through automated or non-human means such as bots or scripts.',
      ],
    },
    {
      title: 'Prohibited activities',
      body: [
        'You may not use the Site for any purpose other than the one we make it available for. The Site may not be used for commercial work except where we specifically endorse or approve it.',
      ],
    },
    {
      title: 'Your account and its security',
      list: [
        'You sign in with a one-time code sent to your mobile or email, through your Bharat ID, or with your user ID and password.',
        'Keep your password and codes to yourself. Pirento staff will never ask you for them.',
        'You are responsible for what happens under your account until you tell us it has been misused.',
      ],
    },
    {
      title: 'Closing your account',
      body: [
        'You can ask us to delete your account from your dashboard. Once approved, we remove your profile and the personal data each product keeps; orders and payments stay on record without your name, for accounts and tax records. An account holding wallet money is closed only after the money is withdrawn.',
      ],
    },
    {
      title: 'Governing law',
      body: [
        'These terms are governed by the laws of India. You and Pirento agree that the courts of India have exclusive jurisdiction over any dispute arising from them.',
      ],
    },
  ],
};

// The ecosystem dashboard: quick actions and the first things worth doing.
export const dashboard = {
  actions: [
    {label: 'Browse legal services', to: '/legal/services'},
    {label: 'Apply for Bharat ID', to: '/bharat-id/dashboard'},
    {label: 'Ask Pirento AI', to: '/ai/dashboard'},
    {label: 'Get help', to: '/support'},
  ],
  // Done-or-not is worked out from your own records in DashboardPage.
  steps: [
    {id: 'name', title: 'Add your name', body: 'So our team knows what to call you.', to: '/account'},
    {
      id: 'order',
      title: 'Place your first order',
      body: 'Every price is shown before you start.',
      to: '/legal/services',
    },
    {
      id: 'identity',
      title: 'Apply for Bharat ID',
      body: 'Seven short steps and a 20-second video.',
      to: '/bharat-id/dashboard',
    },
    {
      id: 'certificate',
      title: 'Earn an Intern certificate',
      body: 'A free exam with a public verify page.',
      to: '/intern/dashboard',
    },
  ],
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
