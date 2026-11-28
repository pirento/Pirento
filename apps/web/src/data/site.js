// All site copy lives here; components only render it.
import {PRODUCTS, SERVICES, LEGAL_CATALOGUE} from '@pirento/shared';

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

// Each product site's navbar: its own three links and its main button, which leads into what the product does.
// Signed out, the bar adds "Sign in"; signed in, "Dashboard".
export const productNav = {
  legal: {
    links: [
      ['Services', '/legal/services'],
      ['How it works', '/legal#how'],
      ['Questions', '/legal#faq'],
    ],
    cta: ['Book a service', '/legal/services', 'Book'],
  },
  black: {
    links: [
      ['Services', '/black#services'],
      ['How it works', '/black#how'],
      ['Questions', '/black#faq'],
    ],
    cta: ['See services', '/black#services', 'Services'],
  },
  green: {
    links: [
      ['Market', '/green/dashboard/market'],
      ['Drives', '/green#services'],
      ['How it works', '/green#how'],
      ['Questions', '/green#faq'],
    ],
    cta: ['Start trading', '/green/dashboard/market', 'Trade'],
  },
  giftox: {
    links: [
      ['Gift boxes', '/giftox#services'],
      ['How it works', '/giftox#how'],
      ['Questions', '/giftox#faq'],
    ],
    cta: ['Send a gift', '/giftox#services', 'Gift'],
  },
  intern: {
    links: [
      ['Tracks', '/intern#more'],
      ['Programmes', '/intern#programmes'],
      ['How it works', '/intern#how'],
      ['Questions', '/intern#faq'],
    ],
    cta: ['Take an exam', '/intern/dashboard/exams', 'Exams'],
  },
  vault: {
    links: [
      ['What you get', '/vault#features'],
      ['How it works', '/vault#how'],
      ['Questions', '/vault#faq'],
    ],
    cta: ['Open my vault', '/vault/dashboard', 'Open'],
  },
  ai: {
    links: [
      ['What it does', '/ai#features'],
      ['Everywhere', '/ai#everywhere'],
      ['Plans', '/ai#plans'],
      ['Questions', '/ai#faq'],
    ],
    cta: ['Start a chat', '/ai/dashboard', 'Chat'],
  },
  one: {
    links: [
      ['Plans', '/one/dashboard/plans'],
      ['How it works', '/one#how'],
      ['Questions', '/one#faq'],
    ],
    cta: ['Become a partner', '/one/dashboard', 'Join'],
  },
  capital: {
    links: [
      ['What it does', '/capital#features'],
      ['How it works', '/capital#how'],
      ['Questions', '/capital#faq'],
    ],
    cta: ['Join the waitlist', '/capital/dashboard', 'Join'],
  },
  'bharat-id': {
    links: [
      ['Apply', '/bharat-id#apply'],
      ['Checks', '/bharat-id#checks'],
      ['Questions', '/bharat-id#faq'],
      ['For business', '/bharat-id/business'],
    ],
    cta: ['Apply now', '/bharat-id/start', 'Apply'],
  },
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
  marquee: 'Ten products, one account',
  // Under each family stack: how to move it.
  stackHint: 'Swipe left for the next card',
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
      {title: 'Give', body: 'Trees and carbon credits, boxes at a door.', products: ['green', 'giftox']},
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
    // The contact form at the end of most pages; what it sends lands in admin → Enquiries.
    form: {
      title: 'Write to us',
      intro: 'Tell us what you need. The team replies by email, or calls if you leave a number.',
      service: 'Which service is it about? (optional)',
      sent: 'Thank you. Your message reached the team; the reply comes to your email.',
    },
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

// Each product's own dashboard: the sections in its sidebar, in order (the first is /<slug>/dashboard).
// Every product shows the one Pirento wallet (same balance everywhere) and links to the one support desk.
const SHARED_SECTIONS = [
  {id: 'wallet', label: 'Wallet', icon: 'wallet'},
  {id: 'support', label: 'Support', icon: 'help', support: true},
];
const ORDER_SECTIONS = (orders, services, extra = []) => [
  {id: 'overview', label: 'Overview', icon: 'overview'},
  {id: 'orders', label: orders, icon: 'orders'},
  ...extra,
  {id: 'receipts', label: 'Receipts', icon: 'receipts'},
  {id: 'services', label: services, icon: 'services'},
  ...SHARED_SECTIONS,
];
/** Products with a single page of their own (Capital's waitlist while it is Expected). */
export const SINGLE_PAGE_SECTIONS = [{id: 'overview', label: 'Dashboard', icon: 'overview'}, ...SHARED_SECTIONS];
const APP_SECTIONS = (...own) => [{id: 'overview', label: 'Overview', icon: 'overview'}, ...own, ...SHARED_SECTIONS];
const DOCUMENTS = {id: 'documents', label: 'Documents', icon: 'documents'};
export const productDashboards = {
  legal: ORDER_SECTIONS('My requests', 'Areas of law', [
    DOCUMENTS,
    {id: 'consultations', label: 'Consultations', icon: 'consultations'},
  ]),
  black: ORDER_SECTIONS('My filings', 'Services', [DOCUMENTS]),
  green: ORDER_SECTIONS('My sponsorships', 'Plantation drives', [
    {id: 'portfolio', label: 'Portfolio', icon: 'portfolio'},
    {id: 'market', label: 'Carbon market', icon: 'market'},
    {id: 'trees', label: 'My trees', icon: 'trees'},
    {id: 'certificates', label: 'Certificates', icon: 'certificates'},
  ]),
  giftox: ORDER_SECTIONS('My gift orders', 'Gift boxes'),
  intern: APP_SECTIONS(
    {id: 'programme', label: 'Programme', icon: 'programme'},
    {id: 'tasks', label: 'Tasks', icon: 'tasks'},
    {id: 'classes', label: 'Live classes', icon: 'classes'},
    {id: 'work', label: 'Paid work', icon: 'work'},
    {id: 'learn', label: 'Learn', icon: 'learn'},
    {id: 'exams', label: 'Exams', icon: 'exams'},
    {id: 'certificates', label: 'Certificates', icon: 'certificates'},
    {id: 'openings', label: 'Openings', icon: 'openings'},
    {id: 'internships', label: 'Internships', icon: 'internships'},
    {id: 'company', label: 'Company', icon: 'company'},
  ),
  vault: APP_SECTIONS(
    {id: 'records', label: 'Records', icon: 'records'},
    {id: 'linked', label: 'Linked accounts', icon: 'linked'},
    {id: 'files', label: 'Documents', icon: 'files'},
    {id: 'passwords', label: 'Passwords', icon: 'passwords'},
    {id: 'legacy', label: 'Nominee and legacy', icon: 'legacy'},
  ),
  ai: [
    {id: 'overview', label: 'Chat', icon: 'chat'},
    {id: 'memory', label: 'Memory', icon: 'memory'},
    {id: 'plans', label: 'Plans', icon: 'plans'},
    ...SHARED_SECTIONS,
  ],
  one: APP_SECTIONS(
    {id: 'referrals', label: 'Referrals', icon: 'referrals'},
    {id: 'plans', label: 'Plans', icon: 'plans'},
  ),
  'bharat-id': APP_SECTIONS(
    {id: 'apply', label: 'Application', icon: 'apply'},
    {id: 'sharing', label: 'Sharing', icon: 'sharing'},
    {id: 'pin', label: 'PIN', icon: 'passwords'},
  ),
};

// The app products' dashboards (Intern, Vault, One, Bharat ID): headings and the words on each section.
// Bharat ID for Business: the public page, the request form, the business dashboard and its API reference.
export const bharatIdBusiness = {
  label: 'Bharat ID for Business',
  title: 'Verified people, / with their consent.',
  hl: 'with their consent.',
  intro:
    'An API for banks, NBFCs, schools, colleges, institutes and websites: check a Bharat ID, and with the holder’s consent receive the details they choose to share.',
  ask: 'Request access',
  home: {
    label: 'For business',
    title: 'Use Bharat ID / in your own checks.',
    intro:
      'Banks, NBFCs, schools, colleges, institutes and websites verify Bharat IDs, ask for consent to see details, and check a person holds their ID, through one prepaid API.',
    cta: 'Bharat ID for Business',
  },
  uses: {
    label: 'Who it is for',
    title: 'Wherever you / check people.',
    items: [
      {
        title: 'Banks',
        body: 'Check a customer’s Bharat ID and, with their consent, receive the details they share for KYC.',
      },
      {title: 'NBFCs', body: 'Confirm who an applicant is before a loan, with the details they allow you to see.'},
      {title: 'Schools', body: 'Check parents, guardians and staff at admission or hiring.'},
      {title: 'Colleges and universities', body: 'Check students and staff when they join.'},
      {title: 'Institutes', body: 'Check learners at enrolment for coaching and training courses.'},
      {title: 'Websites and apps', body: 'Check people at sign-up, with one API call.'},
    ],
  },
  gives: {
    label: 'What you get',
    title: 'Two calls, / a sandbox, a dashboard.',
    items: [
      {
        title: 'Verify',
        body: 'Is this Bharat ID issued? You get the holder’s first name and last initial and their state.',
      },
      {
        title: 'Consent',
        body: 'Ask the holder to share chosen details (name, date of birth, address, PAN, last 4 of Aadhaar, mobile). They allow or decline it in their Bharat ID dashboard; you read the details only once they allow it, and never after they revoke it.',
      },
      {
        title: 'Check it is them',
        body: 'Send the person to a Pirento page where they prove they hold the Bharat ID (PIN and date of birth, codes to their mobile and email, Aadhaar OTP or a face check). You only learn whether it passed.',
      },
      {
        title: 'Test keys and a sandbox',
        body: 'Build against sandbox Bharat IDs from the day you are approved; no real person is touched.',
      },
      {title: 'Live keys', body: 'Open after our team checks your company details and your own Bharat ID.'},
    ],
  },
  how: {
    label: 'How it works',
    title: 'From request / to live keys.',
    steps: [
      {title: 'Request access', body: 'Tell us about your organisation and what you will use Bharat ID for.'},
      {title: 'We review it', body: 'Our team checks the request. We take requests only; there is no self sign-up.'},
      {
        title: 'Your sign-in by email',
        body: 'Once approved you get a user ID, a password and the link to your business dashboard.',
      },
      {title: 'Build with test keys', body: 'Make test keys and try every call against the sandbox.'},
      {
        title: 'Company details',
        body: 'Add your registration details; the person signing in gets their own Bharat ID.',
      },
      {title: 'Go live', body: 'Our team approves live access and your live keys open.'},
    ],
  },
  form: {
    label: 'Request access',
    title: 'Tell us / about you.',
    intro: 'Our team reads every request. If it is approved, the sign-in comes to the work email you give here.',
    terms: 'I accept the terms and confirm I may ask on behalf of this organisation.',
    send: 'Send request',
    sent: 'Thank you. Your request is with our team; we write to your work email once it is reviewed.',
  },
  note: 'Bharat ID is a Pirento identifier, not a government ID. Billing is prepaid: you add credit, and each live call takes the price our team sets; test calls are free.',
  checks: {
    label: 'Checking a holder',
    title: 'Pick the strength / the work needs.',
    intro:
      'Our team opens for each business only the methods its work needs. Sensitive work, such as bank and NBFC KYC, uses the stronger ones.',
  },
  sample: {
    label: 'The API',
    title: 'One header, / plain JSON.',
    intro:
      'Send your key as a Bearer token. Test keys (bid_test_…) answer from the sandbox; live keys (bid_live_…) from issued Bharat IDs.',
  },
  dashboard: {
    title: 'Bharat ID for Business',
    none: 'No Bharat ID for Business account is linked to this sign-in.',
    statuses: {
      test: 'Test access: build with test keys. Add your company details and ask for live access when ready.',
      live_review: 'Your live access request is with our team.',
      live: 'Live: your live keys work.',
      suspended: 'Your API keys are paused.',
    },
    steps: ['Approved', 'Company details', 'Your Bharat ID', 'Live review', 'Live'],
    // The console's sidebar, in groups: day-to-day work, building with the API, and the account.
    sections: [
      {id: 'overview', label: 'Overview', icon: 'overview', group: 'Console'},
      {id: 'checks', label: 'Checks', icon: 'checks', group: 'Console'},
      {id: 'consents', label: 'Consents', icon: 'consents', group: 'Console'},
      {id: 'keys', label: 'API keys', icon: 'passwords', group: 'Build'},
      {id: 'docs', label: 'API reference', icon: 'docs', group: 'Build'},
      {id: 'company', label: 'Company', icon: 'company', group: 'Account'},
      {id: 'billing', label: 'Billing', icon: 'wallet', group: 'Account'},
    ],
  },
};

// The Bharat ID home page: the ways to get one, and the ways to prove it is you afterwards.
export const bharatIdHome = {
  ways: {
    label: 'Get your Bharat ID',
    title: 'Three ways / to apply.',
    intro: 'Whichever way you start, you do the video KYC, the Aadhaar eSign and your PIN yourself.',
    items: [
      {
        title: 'Online, yourself',
        body: 'Sign in to Pirento and fill the application from your Bharat ID dashboard, at your own pace.',
        cta: 'Apply now',
        to: '/bharat-id/start',
      },
      {
        title: 'At an enrolment centre',
        body: 'Scan the centre’s QR with your phone camera and apply on your own phone, with help at hand.',
      },
      {
        title: 'With our team',
        body: 'Give our staff your email and mobile. They can fill the steps with you; a link by email and SMS lets you finish.',
      },
    ],
    reminders: 'Until it is submitted, reminders come by email and SMS after 1, 3 and 7 days, with a link to carry on.',
  },
  auth: {
    label: 'After it is issued',
    title: 'Prove it is you, / the way the moment needs.',
    intro:
      'Sign in to Pirento with your Bharat ID, your 6-digit PIN and your date of birth. When a business checks you, you do it on Pirento’s own page, so they never see your PIN or codes.',
  },
};

// The page an enrolment centre's QR opens on a person's phone, and the poster printed for the centre.
export const bharatIdStart = {
  eyebrow: 'Bharat ID',
  title: 'Get your Bharat ID',
  at: 'You are enrolling at',
  anyway: 'You can still start your application here.',
  steps: [
    'Create your Pirento account, or sign in, on this phone.',
    'Fill seven short steps; each one saves as you go.',
    'Do the video KYC and sign your declaration with Aadhaar eSign, then set your PIN.',
    'Submit. Our team reviews it and your ID comes by email.',
  ],
  create: 'Create my account',
  signIn: 'I already have an account',
  go: 'Start my Bharat ID',
  issued: 'Your Bharat ID is already issued.',
  submitted: 'Your application is already with our team.',
  open: 'Open my Bharat ID',
  staff: 'You are signed in with a staff account. Sign out, then sign in with your own account to apply.',
  poster: {
    title: 'Get your Bharat ID here',
    lines: ['Scan with your phone camera', 'and apply in a few minutes.'],
  },
};

// The Bharat ID steps done on Digio: the video KYC, then the Aadhaar eSign of the declaration.
export const bharatIdVerify = {
  off: 'Verification with Digio is not switched on yet. Your saved steps are kept; come back soon.',
  waiting: 'Digio has not finished yet. It can take a few minutes; check again shortly.',
  check: 'Check again',
  continue: 'Continue',
  busy: 'Opening Digio',
  kyc: {
    intro:
      'A short video KYC on Digio checks that it is really you. Keep your Aadhaar and PAN with you; Digio may ask you to share them from DigiLocker.',
    start: 'Start video KYC',
    resume: 'Continue video KYC',
    again: 'Start again',
    done: 'Your video KYC is done.',
    failed: 'Digio could not complete this KYC. Start it again.',
    closed: 'Digio closed before your video KYC was finished.',
  },
  sign: {
    intro: (stamped) =>
      `Sign your declaration with Aadhaar eSign on Digio. It lists your details and your consent${stamped ? ', on e-stamp paper' : ''}; you confirm with a one-time code sent to the mobile linked to your Aadhaar.`,
    start: 'Sign with Aadhaar',
    resume: 'Continue signing',
    done: 'Your declaration is signed.',
    closed: 'Digio closed before the declaration was signed.',
  },
};

// Shown in place of the Pirento One and Vault dashboards until the person's Bharat ID is issued.
export const bharatIdGate = {
  title: 'Your Bharat ID / comes first.',
  intro: (name) => `${name} opens once your Bharat ID is issued.`,
  status: {
    none: 'You have not started an application yet. It takes seven short steps, a video KYC and an Aadhaar eSign on Digio.',
    draft: 'Your application is saved as a draft. Finish the steps and submit it.',
    submitted: 'Your application is with our team for review. This opens as soon as your ID is issued.',
    rejected: 'Your application needs changes. Open it to see what to fix, then submit it again.',
    suspended: 'Your Bharat ID is suspended, so this stays closed until our team restores it.',
  },
  button: {
    none: 'Start my Bharat ID',
    draft: 'Continue my application',
    submitted: 'See my application',
    rejected: 'Fix my application',
    suspended: 'See my Bharat ID',
  },
};

export const appDashboards = {
  ai: {
    hello: 'Ask Pirento AI.',
    intro:
      'It knows every Pirento service and price, and, when you ask, it reads your own orders, wallet, Bharat ID, Pirento Intern and tickets. General information, not legal or tax advice.',
    examples: [
      'I want to start a company with two friends. What do I need?',
      'What is happening with my latest order?',
      'How much is in my wallet?',
      'What is left in my Bharat ID application?',
    ],
    askExamples: {
      default: [
        'What is happening with my latest order?',
        'How much is in my wallet?',
        'Which Pirento service fits me?',
      ],
      legal: ['Which legal service do I need to register a trademark?', 'What is happening with my latest order?'],
      intern: ['What tasks are due for me?', 'How is my programme mark looking?', 'Which track should I take?'],
      'bharat-id': ['What is left in my Bharat ID application?', 'How do I sign in with my Bharat ID?'],
      one: ['How does the Pirento One commission work?', 'How much is in my wallet?'],
    },
    memory: {
      page: 'What Pirento AI / remembers about you.',
      intro:
        'Write a few facts you want it to keep in mind in every chat (your company, your city, how you like answers). Only what you write here is kept; delete any line, or switch memory off, whenever you like.',
      placeholder: 'e.g. My company is Asha Foods Pvt Ltd, in Pune',
    },
    home: {
      everywhere: {
        label: 'Across Pirento',
        title: 'One assistant, / in every product.',
        intro: 'Pirento AI works inside each product, on your own data, and the team always has the last word.',
        items: [
          [
            'legal',
            'Fill the checkout by chatting, review a contract, reply to a notice, ask about your order, read a document in your language.',
          ],
          ['black', 'Explain a tax notice, list your filing dates and add them to your calendar.'],
          ['green', 'A report of your tree sponsorships, and a CSR section for your company.'],
          ['giftox', 'The right gift box for a budget, and the message to go with it.'],
          ['intern', 'Tasks set for you, a tutor in every lesson, mock interviews and a resume draft.'],
          ['bharat-id', 'Help with each step of the application; it never sees what you type.'],
          ['vault', 'Labels for your files from their names, and a reminder before a document expires.'],
          ['one', 'Messages to share your code, and tips on what your referrals buy.'],
        ],
      },
      plans: {
        label: 'Plans',
        title: 'Free every day, / more with a plan.',
        free: 'Free',
        forever: 'For everyone, every day',
        months: (m) => `For ${m} month${m === 1 ? '' : 's'}`,
        perDay: 'messages a day',
        note: 'Plans are paid from your Pirento wallet and can renew themselves if you choose.',
        choose: 'Choose this plan',
        start: 'Start chatting',
      },
    },
    plans: {
      page: 'More messages, / when you need them.',
      label: 'Your allowance',
      title: 'Messages / a day.',
      none: 'No paid plans yet; the free allowance is for everyone.',
      note: 'Paid from your Pirento wallet. A plan adds messages a day for its months; buying the same plan again adds months.',
    },
  },
  intern: {
    hello: 'Learn, prove it, / get the internship.',
    intro:
      'Read the lessons, take a final exam for a certificate anyone can check, join a programme with live classes, tasks and paid work, and apply to internships companies post here.',
    glance: {label: 'At a glance', title: 'Where you / stand.'},
    next: {label: 'Next', title: 'What to / do next.'},
    exams: {
      label: 'Final exams',
      title: 'Pick a track, / take the exam.',
      history: 'Your attempts',
      noHistory: 'No attempts yet.',
    },
    certificates: {
      label: 'Certificates',
      title: 'Proof you / can show.',
      empty: 'No certificates yet. Pass an exam to earn one.',
    },
    openings: {
      label: 'Openings',
      title: 'Work you / can apply for.',
      mine: 'Your applications',
      noMine: 'You have not applied yet.',
    },
    learn: {label: 'Lessons', title: 'Learn a track, / one lesson at a time.'},
    programme: {
      label: 'Programmes',
      title: 'Three months / to a year.',
      monthsLabel: (m) => `${m} months`,
      homeIntro: 'Prices are set by Pirento and paid from your wallet. Exams and their certificates stay free.',
      months: 'months',
      see: 'Join',
      packageLabel: 'Internship programme',
      soon: 'Price coming soon',
      buy: 'Join from my wallet',
      includes: [
        'Lessons, recorded videos and live classes',
        'A daily, weekly and monthly task set for you by AI',
        'Paid work from across Pirento once you are eligible',
        'A final mark, a grade and a certificate',
        'An AI resume draft from your record',
      ],
      note: 'Paid from your Pirento wallet. A Bharat ID is needed to join. Paid work depends on the work available and is paid only once approved; joining does not guarantee income or a job.',
      resumeNote:
        'Written by AI from your profile, certificates and approved work only. Check it before you use it; once a day.',
    },
    tasks: {title: 'Your tasks, / set for you.'},
    classes: {title: 'Live classes / and recordings.'},
    work: {title: 'Real work, / paid on approval.'},
    internships: {label: 'Your applications', title: 'From applied / to certified.'},
    company: {title: 'Hire interns / on Pirento.'},
    applicationStatus: {
      new: 'Applied',
      shortlisted: 'Shortlisted',
      interview: 'Interview',
      offered: 'Offer made',
      accepted: 'Interning',
      completed: 'Completed',
      declined: 'Not selected',
      turned_down: 'Offer declined',
    },
  },
  vault: {
    hello: 'Your vault, / locked.',
    intro:
      'Records, documents and passwords, sealed with AES-256-GCM before they are stored, and opened only with your Bharat ID PIN. Pirento holds the key, so this is not end-to-end encryption.',
    glance: {label: 'At a glance', title: 'What you / keep here.'},
    health: {
      label: 'Password health',
      title: 'Weak or / reused.',
      good: 'Every saved password is strong and used once.',
      weak: 'weak',
      reused: 'reused',
      note: 'Checked on our server; a password is never sent to your browser just to be checked.',
    },
    files: {label: 'Files', title: 'Documents, / encrypted.'},
    passwords: {label: 'Passwords', title: 'Saved / passwords.'},
  },
  one: {
    hello: 'Share Pirento. / See what it brings.',
    intro: 'Your partner code and link, and every order a client placed through it.',
    link: {label: 'Your link', title: 'Share it / anywhere.'},
    glance: {label: 'At a glance', title: 'What your / link brought.'},
    referrals: {label: 'Referrals', title: 'Orders through / your link.', empty: 'No orders through your link yet.'},
    // The rate comes from the partner's plan (made in admin → Partners); 0 means no commission.
    commission: (plan) =>
      plan?.commissionPct > 0
        ? `On the ${plan.name} plan you earn ${plan.commissionPct}% of each order placed through your link, paid to your Pirento wallet when the order is completed. No income is guaranteed.`
        : 'No commission is being paid on your plan right now. Today this tracks your referrals.',
    plans: {
      label: 'Plans',
      title: 'Free to start, / more with a plan.',
      intro: 'Every partner starts on the free plan. A paid plan raises your commission for as long as it runs.',
      rateLabel: 'commission on each completed order',
      forever: 'Free, with no end date',
      period: (months) => `for ${months} months`,
      until: (date) => `Runs until ${date}`,
      current: 'Your plan',
      recommended: 'Recommended',
      join: 'Become a partner',
      choose: 'Choose this plan',
      buy: (price) => `Buy for ${price}`,
      renew: (price) => `Renew for ${price}`,
      confirm: (name, price) => `${price} will be taken from your Pirento wallet for the ${name} plan. Go ahead?`,
      bought: 'Done. Your new rate applies to orders completed from now on.',
      topUp: 'Add money to your wallet',
      paid: 'Paid from your Pirento wallet. A renewal adds to the time left.',
      empty: 'No plans are on offer yet.',
    },
  },
  'bharat-id': {
    hello: 'One identity, / checked once.',
    intro: 'Seven short steps, a video KYC and an Aadhaar eSign on Digio, then a review by our team.',
    status: {label: 'Status', title: 'Where your / application is.'},
    steps: ['Fill the steps', 'Video KYC on Digio', 'Sign the declaration', 'Submit and review', 'ID issued'],
    card: {label: 'Your ID', title: 'Your Bharat ID / card.'},
    apply: {label: 'Application', title: 'Your details, / step by step.'},
    pin: {
      title: 'Your Bharat ID / PIN.',
      intro:
        'Sign in with your Bharat ID, this PIN and your date of birth, and use it when a business checks it is you.',
    },
    sharing: {
      title: 'Who sees / your details.',
      intro: 'Businesses using Bharat ID ask before they see anything. You decide, and you can stop it later.',
    },
    changes: {
      label: 'Changes',
      title: 'Moved, or a / new number?',
      intro: 'Pick what changed and type the new details. Our team checks them, and your ID shows them once approved.',
      note: 'What changed, and why (optional)',
      send: 'Send to our team',
      waiting: (what) => `Your change to ${what.toLowerCase()} is with our team.`,
      sent: (when) => `Sent on ${when}. We email you when it is decided.`,
      takeBack: 'Take it back',
      fixed:
        'Your name, date of birth and documents were checked by the video KYC and eSign, so they cannot be changed here. Ask support if one of them is wrong.',
      approved: 'Changed',
      rejected: 'Not changed',
    },
  },
};

// A service's own page (features/legal/ServicePage.jsx): headings around the catalogue's sections.
// Pirento Vault's dashboard and its two public pages (the "I am here" link and a nominee's release).
export const vaultCopy = {
  unlock: {
    title: 'Confirm it is you',
    body: 'Type your Bharat ID PIN. Your vault stays open for ten minutes, and every action is logged as confirmed.',
    label: 'Bharat ID PIN',
    submit: 'Unlock',
    checking: 'Checking',
    cancel: 'Cancel',
    cancelled: 'Not unlocked',
  },
  records: {
    label: 'Records',
    title: 'Everything / you keep.',
    intro:
      'Accounts, policies, money lent and owed, dreams, a will. Only the title shows in the list; the rest is sealed until you open it with your PIN.',
    add: 'Add a record',
    kind: 'What is it?',
    name: 'Title',
    release: 'Give this to my nominee',
    save: 'Save record',
    open: 'Open',
    close: 'Close',
    edit: 'Edit',
    remove: 'Delete',
    all: 'All',
    empty: 'Nothing here yet. Add your first record.',
  },
  linked: {
    label: 'Linked accounts',
    title: 'Investments / and cover.',
    intro: 'Mutual funds, stocks, ETFs and insurance in one place, sealed like everything else in your vault.',
    connectTitle: 'Fetch them automatically',
    connectBody:
      'Approve once on your Account Aggregator through Digio. Your mutual funds, stocks, ETFs and insurance come in sealed, and again every month.',
    offBody:
      'Your mutual funds, stocks, ETFs and insurance through Digio, with your consent. Until it is switched on, add them here by hand.',
    connect: 'Link through Digio',
    opening: 'Opening…',
    statuses: {
      pending: 'Waiting for your approval',
      approved: 'Approved, waiting for your providers',
      active: 'Linked',
      rejected: 'You turned it down',
      revoked: 'Consent withdrawn',
      paused: 'Paused in your AA app',
      expired: 'Consent ended',
      failed: 'Could not be set up',
    },
    accounts: (n) => `${n} account${n === 1 ? '' : 's'}`,
    fetched: 'Last fetched',
    asked: 'Asked',
    refresh: 'Check now',
    remove: 'Remove this link',
    removeConfirm:
      'Remove this link and the holdings it fetched? To stop sharing for good, also revoke the consent in your Account Aggregator app.',
  },
  legacy: {
    label: 'Nominee and legacy',
    title: 'If something / happens to you.',
    intro:
      'Choose what goes to your nominee. We release it only after our team has spoken to your nominee and checked a death certificate.',
    how: [
      [
        'You choose',
        'Mark the records, passwords and documents that should go to your nominee. The rest is never released.',
      ],
      [
        'We check in',
        'Any visit to your vault tells us you are well. After three quiet months we remind you in the 4th, 5th and 6th month by email and SMS.',
      ],
      ['We call', 'If no reminder is answered, our team calls your nominee, and your emergency contact if needed.'],
      [
        'We verify',
        'Our team checks the death certificate with the body that issued it through API Setu, and Pirento AI checks the name on it is yours. Bodies not on API Setu are checked against the original.',
      ],
      [
        'We release',
        'Your nominee gets a link on their mobile, proves it with a code, and sees only what you chose, to save as a PDF.',
      ],
      ['We help claim', 'Our team helps your nominee claim each insurance policy you released.'],
    ],
    on: 'Turn on my legacy plan',
    off: 'Turn off',
    consent:
      'I agree that the items I mark go to my nominee named in my Bharat ID, after Pirento has verified my death as described here.',
    status: 'Status',
    lastSeen: 'Last seen',
    reminders: 'Reminders sent',
    nominee: 'Nominee',
    emergency: 'Emergency contact',
    fromId: 'From your Bharat ID. To change them, ask for a change in your Bharat ID dashboard.',
    releasing: (n) => {
      const of = (k, one, many) => `${n[k]} ${n[k] === 1 ? one : many}`;
      return `${of('records', 'record', 'records')}, ${of('credentials', 'password', 'passwords')} and ${of('files', 'document', 'documents')} will go to your nominee.`;
    },
    none: 'Not on yet.',
    alive: 'I am here',
    log: 'Every action',
    intact: 'The log is whole: no entry has been changed or removed.',
    broken: 'An entry in the log does not match. Contact support.',
    legal:
      'Every action is confirmed with your Bharat ID PIN and kept in a log whose entries are chained by hash, so a change shows. This record is not a will: a will must be made the way the law asks. Keep the original safe and note in a Will record where it is.',
    // The same stages as the team's desk names them.
    staffStages: {
      active: 'Active',
      reminding: 'Reminders sent',
      'call-nominee': 'Call the nominee',
      'nominee-reached': 'Nominee reached',
      verified: 'Certificate verified',
      released: 'Released',
      closed: 'Closed',
    },
    stages: {
      active: 'Active: we see you',
      reminding: 'Reminders sent',
      'call-nominee': 'Our team will call your nominee',
      'nominee-reached': 'Our team has spoken to your nominee',
      verified: 'Death certificate verified',
      released: 'Released to your nominee',
      closed: 'Closed',
    },
  },
  alive: {
    title: 'Thank you. / We know you are well.',
    body: 'Your legacy plan is active again. Nothing has been released.',
    failed: 'This link has been used or is no longer needed. Open your vault to check your plan.',
    checking: 'Telling your vault you are here…',
  },
  release: {
    title: 'What was / left for you.',
    intro:
      'Someone named you as their nominee in Pirento Vault. To open what they left, we send a code to your mobile.',
    send: 'Send the code',
    code: '6-digit code',
    open: 'Open',
    print: 'Save as PDF',
    from: 'From',
    certificate: 'Death certificate',
    records: 'Records',
    passwords: 'Passwords',
    files: 'Documents',
    download: 'Download',
    note: 'This page shows only what the owner chose to give you. Pirento verified the death certificate before releasing it. Keep these details private.',
  },
};

// Pirento Legal's home: the price rail and the service page's bar on a phone.
export const legalCopy = {
  popular: 'Asked for most',
  seeAll: (n, area) => `All ${n} in ${area}`,
  swipe: 'Swipe for more',
  prev: 'Earlier services',
  next: 'More services',
  usually: (t) => `Usually ${t}`,
  bar: 'See packages',
  jump: 'Jump to a category',
  results: (n) => `${n} ${n === 1 ? 'service' : 'services'} found`,
  clear: 'Clear search',
  showAll: (n) => `Show all ${n}`,
};

export const servicePageCopy = {
  from: 'From',
  choose: 'See the packages',
  ask: 'Ask a question first',
  quote: 'Request a quote',
  recommended: 'Recommended',
  buy: (name) => `Buy ${name}`,
  buyOne: 'Buy now',
  book: 'Book a consultation',
  packages: {
    label: 'Packages',
    title: 'Pick what / you need.',
    intro: 'The price is fixed before you pay. You can buy without an account; we make one with your mobile.',
  },
  overview: {label: 'Overview', title: 'What it is.'},
  whoFor: 'Who it is for',
  ready: {
    label: 'What you get',
    title: 'Included, and / what to keep ready.',
    included: 'Included',
    notIncluded: 'Confirmed separately',
    documents: 'Documents needed',
    ai: 'What should I have ready for my case? (Pirento AI)',
  },
  how: {label: 'How it works', title: 'Step by / step.'},
  plan: {
    label: 'Plan ahead',
    title: 'What to / expect.',
    timeline: 'What affects the timeline',
    mistakes: 'Common mistakes to avoid',
  },
  costs: {label: 'Understand the cost', title: 'Read the fee / part by part.'},
  deliverables: {label: 'At the end', title: 'What you / receive.'},
  benefits: {label: 'Why do it', title: 'What it / gives you.'},
  faq: {label: 'Questions', title: 'Before you / buy.'},
  related: {label: 'Related', title: 'Often bought / alongside.'},
  // The jump links under the hero, one per section the page shows.
  guide: {
    label: 'Step by step',
    title: 'Explore the complete guide',
    chips: {
      packages: 'Packages',
      overview: 'Overview',
      ready: 'Scope & documents',
      how: 'Process',
      plan: 'Timeline',
      costs: 'Costs',
      deliverables: 'What you get',
      benefits: 'Benefits',
      faq: 'FAQs',
    },
  },
  // The caption under each section's picture, unless admin writes its own.
  art: {
    overview: 'One clear start, with every paper in its place.',
    ready: 'Agree the scope before the work begins.',
    how: 'Every stage has an input and a review point.',
    plan: 'Know what can move the dates.',
    costs: 'Every part of the fee, before you pay.',
    deliverables: 'What you keep at the end.',
    benefits: 'What it gives you as you grow.',
    faq: 'Ask before you buy.',
  },
};

// Pictures that explain a process outside the product and service pages: the Pirento home and Verify.
export const processArt = {
  how: {scene: 'ecosystem', caption: 'One account in the middle; every product around it.'},
  faq: {scene: 'chat', caption: 'Ask before you begin; the answers are below.'},
  pillars: {scene: 'lock', caption: 'One sign-in, one wallet and one identity, kept safe.'},
  catalogue: {scene: 'document', caption: 'Every service lists its price, papers and steps before you start.'},
  business: {scene: 'id', caption: 'A business checks a holder only with the holder’s consent.'},
  support: {scene: 'helpdesk', caption: 'One desk for every product; replies come back here and by email.'},
  company: {scene: 'network', caption: 'The roles this company has open on Pirento Intern.'},
  notFound: {scene: 'search', caption: 'We looked, but this address leads nowhere.'},
  verify: {scene: 'certificate', caption: 'Check any Pirento code against our records in a second.'},
};

// Checkout for someone not signed in (features/orders/GuestDetails.jsx).
export const checkoutGuest = {
  label: 'Your details',
  title: 'Buy without an account.',
  intro:
    'We send a code to your mobile to check it is yours, then make your Pirento account, so you can follow your order and sign in later with your mobile.',
  name: 'Full name',
  email: 'Email',
  terms: 'I have read and accept the',
  termsLink: 'Terms and Conditions',
  send: 'Send code',
  verify: 'Verify and continue',
  wait: 'Please wait',
  change: 'Change details',
  sentTo: (to) => `We sent a 6-digit code to ${to}.`,
  dev: (code) => `Test mode: your code is ${code}.`,
  haveAccount: 'I already have an account',
};

// The printable payment receipt for a paid order (features/orders/ReceiptPage.jsx).
export const receipt = {
  title: 'Payment receipt',
  note: 'This receipt confirms a payment made on Pirento. It is not a GST tax invoice.',
};

// Pirento Green's own sections: the public planting record, the customer's trees and the team's view.
// The record's numbers are counted from paid sponsorships; the market's price is the one the team sets.
export const green = {
  impact: {
    label: 'The record',
    title: 'Counted from / real sponsorships.',
    intro:
      'Trees sponsored and trees our team has recorded as planted, counted live from paid orders. A tree counts as planted only once its site and date are written down.',
    empty: 'No sponsorships yet. The first one starts this record.',
    recent: 'Latest planting records',
  },
  trees: {
    label: 'My trees',
    title: 'Where your / trees went in.',
    intro:
      'Every tree you sponsored, and the planting record our team writes once they are in the ground: the site, the date and the spot on the map.',
    empty: 'No trees sponsored yet.',
    waiting: 'Paid · waiting for its planting record',
  },
  market: {
    label: 'Carbon market',
    title: 'Buy and sell / carbon credits.',
    intro:
      'Trade Pirento Green carbon credits with your Pirento wallet at the price the Pirento Green team sets. Credits are held to 0.01.',
    closed: 'The market is closed just now. Your credits stay in your account.',
    caveat:
      'The price is set by the Pirento Green team, not by an exchange, and it can go down as well as up. Credits are held on Pirento.',
    trades: 'Your trades',
    noTrades: 'No trades yet.',
  },
  portfolio: {
    label: 'Portfolio',
    title: 'Everything you / hold with us.',
    intro:
      'Trees you invested in are held at what you paid; your carbon credits at today’s price. Donations are shown apart: they are a gift, not a holding.',
    trees: 'Tree investments',
    credits: 'Carbon credits',
    donations: 'Donations',
    byDrive: 'By drive',
  },
  certificate: {
    label: 'Certificates',
    title: 'Download / your certificates.',
    intro:
      'Every planted sponsorship gets a certificate you can download and anyone can check on Verify, by its number or its order number.',
    empty: 'No certificates yet. A certificate is issued once your trees are planted.',
    waiting: 'Certificate once planted',
    invest: {
      title: 'Certificate of tree investment',
      issuer: 'Pirento Green',
      line: 'has invested in the planting of',
      note: 'Planted trees grow carbon credits at the drive’s rate, shown in your Pirento Green portfolio. The credit price can go down as well as up.',
    },
    donate: {
      title: 'Certificate of tree donation',
      issuer: 'Pirento Foundation',
      line: 'has donated the planting of',
      note: 'Thank you for your gift to the planet. Pirento Foundation’s registration is pending, so this certificate is not a tax (80G) receipt.',
    },
    verify: 'Check this certificate at',
  },
  snapshot: {
    label: 'Carbon account',
    title: 'Your credits / at a glance.',
    open: 'Market open',
    closed: 'Market closed',
    links: [
      ['Trade credits', '/green/dashboard/market'],
      ['Claim from your trees', '/green/dashboard/trees'],
      ['Invest in trees', '/green#services'],
      ['Certificates', '/green/dashboard/certificates'],
      ['Donate trees', '/services/green-donate'],
    ],
  },
  widget: {label: 'Carbon credit', cta: 'Open the market', closed: 'Market closed', unpriced: 'Price not set yet'},
  admin: {
    drives: 'By drive',
    waiting: 'Waiting for a planting record',
    waitingIntro: 'Paid sponsorships with no planting site yet, oldest first. Open one to write its record.',
    none: 'Every paid sponsorship has its planting record.',
    prices: 'Open, reprice or retire a drive in Services & prices.',
    market: 'Carbon market',
    marketIntro:
      'Set the price per credit and open or close trading. Every price change is kept and drawn on the chart. Growth rate: credits one planted tree grows in a year on that drive.',
    switchOff: 'Trading is switched off on this server (GREEN_TRADING). Prices can still be set.',
  },
};

// Dashboards of the order-based products (Legal, Black, Green, Giftox): section names and headings.
export const orderDashboard = {
  recent: {label: 'Latest', title: 'Your latest / orders.'},
  glance: {label: 'At a glance', title: 'Your work with us.'},
  waiting: {label: 'Needs you', title: 'Waiting / on you.', empty: 'Nothing is waiting on you.'},
  orders: {label: 'Your orders', title: 'Every order, / step by step.', empty: 'No orders yet.'},
  start: {
    label: 'Start something',
    // Legal shows its areas of law; the other products show their services and prices.
    legalTitle: 'Pick an area / of law.',
    title: 'Order / something new.',
  },
  documents: {
    label: 'Documents',
    title: 'Every paper, / both ways.',
    intro: 'What you sent us and what our team sent back, across all your orders. Add a document from inside an order.',
    empty: 'No documents yet. Open an order to add the papers it needs.',
  },
  consultations: {
    label: 'Consultations',
    title: 'Talk to / an expert.',
    intro: 'Book a paid consultation with a lawyer, CA or CS, then agree a time with the team in its messages.',
    mine: 'Your consultations',
    // The catalogue's consultation area; the first four are the quick calls.
    area: 'Consultation & Support',
  },
  wallet: {
    label: 'Wallet',
    title: 'One wallet, / every product.',
    intro: 'The same Pirento wallet and balance in every product. Add money once, pay anywhere.',
    paid: 'Paid from your wallet here',
  },
};

// The Pirento dashboard's own pages: the account's money and records across every product.
export const hub = {
  payments: {title: 'Payments', label: 'Every product', heading: 'Every rupee, / in and out.'},
  subscriptions: {
    title: 'Subscriptions',
    label: 'Plans',
    heading: 'No plans / to renew.',
    // True today: every Pirento product is paid per order, so there is nothing recurring to show.
    empty: 'You have no subscriptions. Pirento products are paid per order, so nothing renews or charges you again.',
  },
};

/** The one support desk. `?product=<slug>` (and `&order=<no>`) say where someone came from. */
export const support = {
  title: 'Support',
  heading: 'How can / we help?',
  intro: 'One desk for every Pirento product, your account and your wallet. A person on our team replies.',
  about: 'Related product',
  general: 'My account or wallet',
  tabs: [
    {id: 'tickets', label: 'My tickets'},
    {id: 'chat', label: 'Live chat'},
    {id: 'email', label: 'Email'},
    {id: 'call', label: 'Callback'},
  ],
  // Quick topics fill in the form; the customer can still change anything.
  topics: [
    {
      title: 'Billing and payments',
      body: 'Charges, refunds, receipts, the wallet.',
      subject: 'Billing question',
      priority: 'medium',
    },
    {
      title: 'Technical help',
      body: 'Something on the site is not working.',
      subject: 'Something is not working',
      priority: 'high',
    },
    {
      title: 'Account access',
      body: 'Sign-in, codes, password, security.',
      subject: 'Trouble signing in',
      priority: 'high',
    },
  ],
  priorities: [
    {id: 'low', label: 'Low · when you can'},
    {id: 'medium', label: 'Medium'},
    {id: 'high', label: 'High · it blocks me'},
  ],
  chat: {
    title: 'Chat with / the team.',
    intro: 'A conversation that stays on record. Our team answers here, and you can come back to it any time.',
    start: 'Start a chat',
    subject: 'Live chat',
  },
  email: {
    title: 'Write to / us.',
    intro: 'Prefer your own email? Send it to our support address and the team replies by email.',
  },
  call: {
    title: 'We call / you back.',
    intro:
      'Leave your number and what it is about. Someone from the team calls you, and the request stays under My tickets.',
    topics: ['An order', 'A payment or refund', 'My account', 'Something else'],
    done: 'Callback requested. You can follow it under My tickets.',
  },
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
      body: 'Seven short steps, a video KYC and an Aadhaar eSign.',
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
  legal: 'justice',
  black: 'ledger',
  green: 'planting',
  intern: 'classroom',
  ai: 'assistant',
  vault: 'vault',
  one: 'partners',
  capital: 'loan',
  'bharat-id': 'idcheck',
  giftox: 'delivery',
};

// Each product's card on the Pirento home: its own small scene, drawn for that card only.
export const productCardArt = {
  legal: 'lawbook',
  black: 'invoice',
  green: 'earth',
  intern: 'gradcap',
  ai: 'chip',
  vault: 'keyring',
  one: 'megaphone',
  capital: 'coins',
  'bharat-id': 'qrcard',
  giftox: 'balloons',
};

// The home's family stacks: one picture per card, by the card's name (ventures, alongside).
export const familyArt = {
  'A T Elevator': 'liftdoors',
  'A T Facility': 'mop',
  'Inzario Space': 'sofa',
  'Shri Sarraf': 'ring',
  'JBC Seva Trust': 'carehands',
};

// Each product home's second picture: how its work goes, under "How it works" (Pirento One has no such section, so its
// picture sits under "Who it is for"). Every scene on the site is used in one place only; captions say only what each
// product does today.
export const productArt = {
  legal: {how: {scene: 'signing', caption: 'Papers drafted, signed and filed, with every step in your dashboard.'}},
  black: {how: {scene: 'gstportal', caption: 'Returns filed on the portal, with the acknowledgement kept for you.'}},
  green: {how: {scene: 'carbonmarket', caption: 'The credit price on a chart; buy and sell from your wallet.'}},
  intern: {how: {scene: 'taskboard', caption: 'Tasks move from to-do to approved, then to a graded certificate.'}},
  ai: {how: {scene: 'summary', caption: 'Share a long document; get the short version in plain words.'}},
  vault: {how: {scene: 'cloudfiles', caption: 'Folders kept encrypted, opened only by you.'}},
  one: {who: {scene: 'commission', caption: 'Each completed order you referred adds your share to your wallet.'}},
  capital: {how: {scene: 'waitlist', caption: 'Join the waitlist; we tell you when Capital opens.'}},
  'bharat-id': {how: {scene: 'consent', caption: 'A business sees your details only after you agree.'}},
  giftox: {how: {scene: 'unboxing', caption: 'A packed box with a card, delivered to the address you give.'}},
};
