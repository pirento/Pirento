// The ten Pirento products. Every line here describes what the product does
// today and what it does not do yet. Keep it that way: no numbers or claims
// that are not true.
import {PRODUCT_COLOURS, textOn} from './brand.js';
import {PRODUCT_DETAILS} from './productDetails.js';

const signIn = {
  title: 'Sign in with email',
  body: 'A 6-digit code, no password. One account works on every Pirento site.',
};

// Each product's own site: its status pill, how it works, and its questions.
// Colours come from the brand register (data/brand.js), not from here.
const SITE = {
  legal: {
    pill: 'Accepting clients',
    steps: [
      {title: 'Pick a service', body: 'Every service shows its price and usual time before you start.'},
      signIn,
      {title: 'Answer a few questions', body: 'Your state, your setup and what you need. It takes a minute.'},
      {title: 'We do the work', body: 'Pay once; follow each step and our notes in your dashboard.'},
    ],
    faq: [
      {
        q: 'Is the price final?',
        a: 'For fixed-price services, yes. For litigation and advisory work you pay for a consultation first, and we quote the full fee after it.',
      },
      {
        q: 'Who does the work?',
        a: 'Our team picks up your order, updates it in your dashboard and closes it with a completion code.',
      },
      {
        q: 'Can I talk to someone first?',
        a: 'Yes. Book a 30-minute talk with a lawyer, CA or CS, or write to support.',
      },
    ],
  },
  black: {
    pill: 'Filing season open',
    steps: [
      {title: 'Choose the filing', body: 'GST, ITR, TDS, accounting or documents, each with a fixed price.'},
      signIn,
      {title: 'Share your details', body: 'Tell us who you are filing for and when it is due.'},
      {title: 'Track and verify', body: 'Follow the work in your dashboard; finished work gets a BLK- code.'},
    ],
    faq: [
      {
        q: 'Do you file with GSTN automatically?',
        a: 'No. Our team prepares and files the work; there is no automatic GSTN filing.',
      },
      {
        q: 'Are drafts ready to use as they are?',
        a: 'Drafts need review by a qualified person before you rely on them.',
      },
    ],
  },
  green: {
    pill: 'Drives open',
    steps: [
      {title: 'Pick a drive', body: 'Three plantation drives, each with its price per tree.'},
      {title: 'Choose how many trees', body: 'From one tree up to 500 in a single order.'},
      signIn,
      {title: 'Keep the record', body: 'Your sponsorship stays in your dashboard with a GRN- code once done.'},
    ],
    faq: [
      {
        q: 'Do I get carbon credits?',
        a: 'No. Sponsorship is a record of trees you paid for; no certified credit, return or CSR eligibility is promised.',
      },
      {q: 'Can I sponsor for my company?', a: 'Yes. Choose the scale that fits at checkout and tell us in the notes.'},
    ],
  },
  intern: {
    pill: 'Exams open',
    tracks: ['General', 'Web development', 'Data science', 'Marketing', 'Design'],
    steps: [
      signIn,
      {title: 'Pick a track', body: 'Five tracks, from general skills to design.'},
      {title: 'Take the exam', body: '10 questions in 30 minutes. 60% passes; a retake is open after 24 hours.'},
      {title: 'Share your certificate', body: 'A PC- code and QR open its public verify page.'},
    ],
    faq: [
      {q: 'Is there a fee?', a: 'No. The exam and certificate are free.'},
      {
        q: 'Does a certificate get me a job?',
        a: 'It proves you passed our exam. It does not guarantee placement, accreditation or income.',
      },
    ],
  },
  ai: {
    pill: 'Assistant online',
    examples: [
      'I want to start a company with two friends. What do I need?',
      'GST registration kitne din mein ho jaata hai?',
      'Which gift box works for a client thank-you?',
    ],
    steps: [
      signIn,
      {title: 'Ask in your words', body: 'English, Hindi or a mix. Up to 30 messages a day.'},
      {title: 'Get a service link', body: 'Answers point to the exact Pirento service and its price.'},
    ],
    faq: [
      {q: 'Is this legal advice?', a: 'No. It gives general information. For your matter, book a consultation.'},
      {
        q: 'Are my chats private?',
        a: 'They are saved in your account until you delete them, and sent to our AI provider to answer you.',
      },
    ],
  },
  vault: {
    pill: 'Encrypted at rest',
    steps: [
      signIn,
      {title: 'Upload or save', body: 'Files up to 5 MB each, 50 MB in all, and any number of passwords.'},
      {title: 'Encrypted on arrival', body: 'Each item is sealed with AES-256-GCM and its own random IV.'},
      {title: 'Open when you need it', body: 'Download a file or reveal a password from your dashboard.'},
    ],
    faq: [
      {
        q: 'Can Pirento read my files?',
        a: 'Pirento holds the key, so its servers can decrypt your data. This is not end-to-end encryption.',
      },
      {q: 'What if I lose access?', a: 'Sign in again with your email code. Nominee handover is not built yet.'},
    ],
  },
  one: {
    pill: 'Partners welcome',
    steps: [
      signIn,
      {title: 'Get your code', body: 'One click gives you a partner code and a link.'},
      {title: 'Share the link', body: 'Clients who open it and order are credited to your code.'},
      {title: 'Watch it grow', body: 'See each referred order and its status in your dashboard.'},
    ],
    faq: [
      {
        q: 'Do I earn commission?',
        a: 'Not yet. Today Pirento One tracks referrals; payout is not built and no income is guaranteed.',
      },
      {
        q: 'Can I see my clients’ details?',
        a: 'No. You see the order and its status, never their contact details or answers.',
      },
    ],
  },
  capital: {
    pill: 'Waitlist open',
    steps: [
      {title: 'Plan the loan', body: 'Try any amount, rate and term in the EMI calculator.'},
      signIn,
      {title: 'Join the waitlist', body: 'Tell us what the loan is for; we reply when lending opens.'},
    ],
    faq: [
      {q: 'Can I get a loan today?', a: 'No. Lending needs regulatory approval that Pirento does not have yet.'},
      {q: 'Is the EMI exact?', a: 'It is an estimate on a reducing balance, not a loan offer.'},
    ],
  },
  'bharat-id': {
    pill: 'Applications open',
    steps: [
      signIn,
      {
        title: 'Fill seven short steps',
        body: 'Contact, personal, documents, address, work, bank, nominee. Each one is saved as you go.',
      },
      {
        title: 'Record a 20-second video',
        body: 'Say your name and a one-time code on camera, so we know it is really you.',
      },
      {title: 'We review by hand', body: 'Our team checks your details. If something needs a change, we tell you why.'},
      {title: 'Get your ID', body: 'A 10-digit Bharat ID with a QR to its public verify page.'},
    ],
    faq: [
      {q: 'Is Bharat ID a government ID?', a: 'No. It is a Pirento identifier for Pirento products.'},
      {
        q: 'Do you store my Aadhaar number?',
        a: 'No. We check its format and checksum, then keep only the last 4 digits. The same goes for your bank account.',
      },
      {q: 'Can I stop halfway?', a: 'Yes. Each step is saved; come back and continue where you left off.'},
      {
        q: 'What happens to my video?',
        a: 'Our team watches it to check it is you, then it is deleted once your ID is issued.',
      },
    ],
  },
  giftox: {
    pill: 'Gifting open',
    steps: [
      {title: 'Pick a box', body: 'Six boxes, each with its contents and price.'},
      signIn,
      {title: 'Tell us where', body: 'Recipient name, address, PIN code and the occasion.'},
      {title: 'Track the gift', body: 'Follow it in your dashboard; delivered gifts get a GFT- code.'},
    ],
    faq: [
      {q: 'When will it arrive?', a: 'Our team confirms timing after your order. Delivery dates are not guaranteed.'},
      {q: 'Can I send many boxes?', a: 'Yes, up to 50 of one box in a single order.'},
    ],
  },
};

export const PRODUCTS = [
  {
    slug: 'legal',
    name: 'Pirento Legal',
    short: 'Legal',
    quote: 'Justice is truth in action.',
    overview: 'Browse legal services, submit a request and track the work our team does for you.',
    highlights: [
      {title: 'Business setup', body: 'Company, LLP, OPC and firm registration with a fixed price.'},
      {title: 'Licences and tax', body: 'GST, FSSAI, IEC, ITR and TDS work handled by our team.'},
      {title: 'Talk to an expert', body: 'Book a paid 30-minute consultation with a lawyer, CA or CS.'},
    ],
    caveat: 'Catalog descriptions are not proof of professional licensing, partner authorization or legal approval.',
    status: 'now',
  },
  {
    slug: 'black',
    name: 'Pirento Black',
    short: 'Black',
    quote: 'Document and filing workflows.',
    overview: 'GST, ITR, TDS, accounting and business documents, done by our team at a fixed price.',
    highlights: [
      {title: 'Tax filing', body: 'GST, ITR and TDS filing with the price shown before you start.'},
      {title: 'Books and documents', body: 'Accounting, bookkeeping and business document drafting.'},
      {title: 'Completion code', body: 'Finished work gets a BLK- code anyone can check.'},
    ],
    caveat: 'Drafts need qualified review. There is no automatic GSTN filing. Stamps and e-Sign are not available yet.',
    status: 'now',
  },
  {
    slug: 'green',
    name: 'Pirento Green',
    short: 'Green',
    quote: 'The earth is what we all have in common.',
    overview: 'Sponsor trees on a plantation drive and keep the record in your account.',
    highlights: [
      {title: 'Drive catalog', body: 'Pick a plantation drive and see its price per tree.'},
      {title: 'Sponsor trees', body: 'Choose how many trees, pay from your wallet, and track the order.'},
      {title: 'Proof code', body: 'Each completed sponsorship gets a code anyone can verify.'},
    ],
    caveat:
      'No certified carbon credit, planting outcome, return or CSR eligibility is promised. Credit trading is not available.',
    status: 'now',
  },
  {
    slug: 'intern',
    name: 'Pirento Intern',
    short: 'Intern',
    quote: 'The expert in anything was once a beginner.',
    overview: 'Pick a track, take the final exam, and earn a certificate anyone can verify.',
    highlights: [
      {title: 'Five tracks', body: 'General, web development, data science, marketing and design.'},
      {title: 'Final exam', body: 'Ten questions, 30 minutes. Pass with 60% or more.'},
      {title: 'Certificates', body: 'Each certificate has a code and a QR that open its public verify page.'},
    ],
    caveat: 'Participation does not guarantee employment, placement, accreditation or income.',
    status: 'now',
  },
  {
    slug: 'ai',
    name: 'Pirento AI',
    short: 'AI',
    quote: 'The future belongs to those who prepare for it today.',
    overview: 'Ask the Pirento assistant which service fits your need, in English or Hindi.',
    highlights: [
      {title: 'Knows the catalog', body: 'Answers with real Pirento services, prices and links.'},
      {title: 'Saved chats', body: 'Your conversations stay in your account until you delete them.'},
      {title: 'Fair use', body: '30 messages a day per account.'},
    ],
    caveat: 'AI answers can be wrong and are not legal, tax or financial advice. Check before you act.',
    status: 'now',
  },
  {
    slug: 'vault',
    name: 'Pirento Vault',
    short: 'Vault',
    quote: 'Privacy is not an option, it is a right.',
    overview: 'Store your files and passwords encrypted at rest on our servers.',
    highlights: [
      {
        title: 'Encrypted files',
        body: 'Files are encrypted at rest with AES-256-GCM. The service manages the key.',
      },
      {title: 'Credential storage', body: 'Store and retrieve encrypted credentials from your account.'},
      {title: 'File management', body: 'Browse, download and remove your files within your limits.'},
    ],
    caveat: 'Vault is not zero-knowledge or end-to-end encrypted. Nominee handover is not built yet.',
    status: 'now',
  },
  {
    slug: 'one',
    name: 'Pirento One',
    short: 'One',
    quote: 'Alone we can do so little; together we can do so much.',
    overview: 'Get a partner code, share it, and see every order it brings in.',
    highlights: [
      {title: 'Partner code', body: 'One code and link to share with your clients.'},
      {title: 'Referred orders', body: 'See each order placed with your code and its status.'},
      {title: 'Client privacy', body: 'You see the order, never your client’s contact details or answers.'},
    ],
    caveat: 'Commission payout is not available yet. No income is guaranteed.',
    status: 'now',
  },
  {
    slug: 'capital',
    name: 'Pirento Capital',
    short: 'Capital',
    quote: "Capital isn't scarce; vision is.",
    overview: 'Work out a loan EMI and join the waitlist for Pirento Capital.',
    highlights: [
      {title: 'EMI calculator', body: 'See the monthly payment and total interest for any amount, rate and term.'},
      {title: 'Waitlist', body: 'Tell us what you need; we write to you when lending opens.'},
      {title: 'No lending yet', body: 'Pirento does not lend money today.'},
    ],
    caveat:
      'Lending needs regulatory approval that Pirento does not have yet. The calculator is an estimate, not an offer.',
    status: 'expected',
  },
  {
    slug: 'bharat-id',
    name: 'Bharat ID',
    short: 'Bharat ID',
    quote: 'Identity is the foundation of trust.',
    overview: 'One reviewed identity for every Pirento product, with a public verify page.',
    highlights: [
      {title: 'Apply once', body: 'Submit your details. Our team reviews them and issues your ID.'},
      {title: '10-digit ID', body: 'A checksum catches a mistyped digit before it reaches us.'},
      {title: 'Public verify', body: 'Anyone can check an ID with its number or QR code.'},
    ],
    caveat: 'Bharat ID is an application identifier, not a government identity credential.',
    status: 'now',
  },
  {
    slug: 'giftox',
    name: 'Giftox',
    short: 'Giftox',
    quote: 'The best gifts are those given from the heart.',
    overview: 'Six ready gift boxes for teams, clients and festivals, delivered to the address you give.',
    highlights: [
      {title: 'Six boxes', body: 'From ₹1,499 to ₹5,999, each with its contents listed.'},
      {title: 'Send to anyone', body: 'Give the recipient’s name, address and PIN code at checkout.'},
      {title: 'Track it', body: 'Every gift order shows its progress in your dashboard.'},
    ],
    caveat: 'Delivery dates, inventory and corporate partnerships are not guaranteed.',
    status: 'now',
  },
].map((p) => {
  const {dark, accent} = PRODUCT_COLOURS[p.slug];
  return {...p, ...SITE[p.slug], ...PRODUCT_DETAILS[p.slug], color: accent, dark, onColor: textOn(accent, dark)};
});

export const getProduct = (slug) => PRODUCTS.find((p) => p.slug === slug) ?? null;
