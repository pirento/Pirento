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
  green: ORDER_SECTIONS('My sponsorships', 'Plantation drives'),
  giftox: ORDER_SECTIONS('My gift orders', 'Gift boxes'),
  intern: APP_SECTIONS(
    {id: 'exams', label: 'Exams', icon: 'exams'},
    {id: 'certificates', label: 'Certificates', icon: 'certificates'},
    {id: 'openings', label: 'Openings', icon: 'openings'},
  ),
  vault: APP_SECTIONS(
    {id: 'files', label: 'Files', icon: 'files'},
    {id: 'passwords', label: 'Passwords', icon: 'passwords'},
  ),
  ai: [{id: 'overview', label: 'Chat', icon: 'chat'}, ...SHARED_SECTIONS],
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
  },
  button: {
    none: 'Start my Bharat ID',
    draft: 'Continue my application',
    submitted: 'See my application',
    rejected: 'Fix my application',
  },
};

export const appDashboards = {
  intern: {
    hello: 'Your exams / and certificates.',
    intro: 'Take a final exam, earn a certificate with a public verify page, and apply to openings.',
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
    applicationStatus: {new: 'Applied', shortlisted: 'Shortlisted', declined: 'Not selected'},
  },
  vault: {
    hello: 'Your vault, / locked.',
    intro:
      'Files and passwords, encrypted with AES-256-GCM before they are stored. Pirento holds the key, so this is not end-to-end encryption.',
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
  },
};

// The printable payment receipt for a paid order (features/orders/ReceiptPage.jsx).
export const receipt = {
  title: 'Payment receipt',
  note: 'This receipt confirms a payment made on Pirento. It is not a GST tax invoice.',
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
