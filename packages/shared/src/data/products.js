// The ten Pirento products. Every line here describes what the product does
// today and what it does not do yet. Keep it that way: no numbers or claims
// that are not true.
import {PRODUCT_COLOURS, textOn} from './brand.js';
import {PRODUCT_DETAILS} from './productDetails.js';

// Pirento One and Vault open only once the person's Bharat ID is issued (enforced by those services).
const bharatIdFirst = (name) => ({
  title: 'Get your Bharat ID',
  body: `${name} opens once your Bharat ID is issued: seven short steps, a video KYC and an Aadhaar eSign on Digio, then a review by our team.`,
});

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
    pill: 'Market open',
    steps: [
      signIn,
      {title: 'Add money to your wallet', body: 'One Pirento wallet pays for everything, by card or UPI.'},
      {
        title: 'Buy or sell credits',
        body: 'Trade carbon credits to 0.01 at the price shown on the chart; money moves in your wallet at once.',
      },
      {
        title: 'Or buy or donate trees',
        body: 'Bought trees grow credits every day once planted: claim them and sell when you like. Donated trees are a gift.',
      },
    ],
    faq: [
      {
        q: 'Who sets the price?',
        a: 'The Pirento Green team. Every change is kept and drawn on the chart; there is no outside exchange price.',
      },
      {
        q: 'How do trees grow credits?',
        a: 'Each drive has a rate: the credits one planted tree grows in a year. Growth counts from the planting date the team records on your order, and you claim it from Green → My trees.',
      },
      {
        q: 'Can I lose money?',
        a: 'Yes. The price can go down as well as up, so a sale can bring back less than you paid.',
      },
      {
        q: 'What is the difference between buying and donating trees?',
        a: 'Bought trees grow carbon credits for you once planted. Donated trees are planted the same way and you see the same planting record, but they grow no credits. A donation is paid to Pirento Green, not to a registered charity, so it carries no 80G tax receipt.',
      },
      {
        q: 'How do I check a certificate?',
        a: 'Every planted investment (PG-…) and donation (PF-…) gets a certificate you download from Green → Certificates. Anyone can check it on Verify with its number or its order number.',
      },
      {q: 'Can I sponsor for my company?', a: 'Yes. Choose the scale that fits at checkout and tell us in the notes.'},
      {
        q: 'How do I know my trees were planted?',
        a: 'Once they are in the ground our team writes the planting record on your order: the site, the date and the spot on the map. You see it in Green → My trees, and you are emailed when it is written.',
      },
    ],
  },
  intern: {
    pill: 'Exams open',
    tracks: ['General', 'Web development', 'Data science', 'Marketing', 'Design'],
    steps: [
      signIn,
      {
        title: 'Learn and pass an exam',
        body: 'Read a track’s lessons, with an AI tutor and a mock interview, then take its timed exam for a free certificate anyone can verify.',
      },
      {
        title: 'Join a programme',
        body: '3, 6, 9 or 12 months from your wallet: live classes, recorded videos and daily, weekly and monthly tasks set for you.',
      },
      {
        title: 'Do real work',
        body: 'Once eligible, paid work from across Pirento is matched to you, and you can apply to internships companies post here.',
      },
      {
        title: 'Finish with a grade',
        body: 'Tasks, work, attendance and lessons make your final mark; passing gives a programme certificate.',
      },
    ],
    faq: [
      {
        q: 'Is there a fee?',
        a: 'The track exams and their certificates are free. The 3, 6, 9 and 12-month programmes are paid from your Pirento wallet; their prices show on the Programme page.',
      },
      {
        q: 'How does paid work happen?',
        a: 'On a programme, once your Bharat ID is issued, you have passed a track exam and filled your profile, work from across Pirento is matched to you. The AI suggests who fits, the team confirms, and approved work is paid into your wallet, which you can withdraw.',
      },
      {
        q: 'Does a certificate get me a job?',
        a: 'It proves you passed our exam. It does not guarantee placement, accreditation or income.',
      },
      {
        q: 'How do live classes work?',
        a: 'Each class has a time and a Meet or Zoom link in your dashboard; pressing Join while it runs counts your attendance. Recordings stay for interns on a programme.',
      },
      {
        q: 'Can my company hire interns here?',
        a: 'Yes. Ask from Intern → Company; once the team approves you, post openings and take applicants from interview to offer, tasks and certificate.',
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
      {
        title: 'Ask your way',
        body: 'Type or speak in English, Hindi or a mix, or attach a notice or bill to have it explained.',
      },
      {
        title: 'Get answers that know you',
        body: 'It points to the exact Pirento service and price, and, when you ask, reads your own orders, wallet, Bharat ID, Intern and tickets.',
      },
      {
        title: 'Use it everywhere',
        body: 'Ask Pirento AI from any Pirento dashboard; it knows which product you are in.',
      },
    ],
    faq: [
      {q: 'Is this legal advice?', a: 'No. It gives general information. For your matter, book a consultation.'},
      {
        q: 'Are my chats private?',
        a: 'They are saved in your account until you delete them, and sent to our AI provider to answer you.',
      },
      {
        q: 'Can it see my account?',
        a: 'Only yours, and only when you ask about it: your orders, wallet, Bharat ID, Intern and tickets, as short summaries. It never sees anyone else’s.',
      },
      {
        q: 'What happens to a file I attach?',
        a: 'It is sent with that one question to be explained and is not stored; the chat keeps only its name.',
      },
      {
        q: 'Does it remember me?',
        a: 'Only if you switch on Memory and write the notes yourself. You can delete any note, or switch it off, whenever you like.',
      },
      {
        q: 'How many messages can I send?',
        a: 'Everyone gets a free number each day; plans paid from your Pirento wallet give more. Both are shown on this page.',
      },
    ],
  },
  vault: {
    pill: 'Encrypted at rest',
    steps: [
      signIn,
      bharatIdFirst('Pirento Vault'),
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
      bharatIdFirst('Pirento One'),
      {title: 'Get your code', body: 'One click gives you a partner code and a link.'},
      {title: 'Share the link', body: 'Clients who open it and order are credited to your code.'},
      {title: 'Watch it grow', body: 'See each referred order and its status in your dashboard.'},
    ],
    faq: [
      {
        q: 'Do I earn commission?',
        a: 'Yes, at your plan’s rate: a share of each order completed through your link goes to your Pirento wallet. Everyone starts on the free plan; a paid plan raises the rate while it runs. No income is guaranteed.',
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
        title: 'Video KYC on Digio',
        body: 'A short video KYC on Digio checks it is really you; it may ask for your Aadhaar and PAN from DigiLocker.',
      },
      {
        title: 'Sign with Aadhaar',
        body: 'You sign your declaration with Aadhaar eSign on Digio, with a one-time code to your Aadhaar mobile.',
      },
      {title: 'Set your PIN', body: 'A 6-digit PIN only you know, to sign in and to prove it is you later.'},
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
        a: 'Your video KYC runs on Digio and stays with Digio; Pirento does not store it. Our team opens it from Digio to check it is you.',
      },
      {
        q: 'Why do I sign a declaration?',
        a: 'It records your details and your consent. You sign it with Aadhaar eSign on Digio and can download the signed copy from your dashboard.',
      },
      {
        q: 'Can I change my details later?',
        a: 'Your contact, address, work, bank and nominee, yes: ask from your dashboard and our team checks the change first. Your name, date of birth and documents were checked by the video KYC and eSign, so ask support if one is wrong.',
      },
      {
        q: 'Who can see my details?',
        a: 'Only the short public facts on the verify page: your masked name, state and issue date. A business sees more only after you approve its request in your dashboard, and you can stop it there.',
      },
      {
        q: 'Can a Bharat ID be suspended?',
        a: 'Yes, if our team finds it misused or wrong. It then stops working everywhere until it is restored, its verify page says so, and we email you why.',
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
    quote: 'Invest in the planet.',
    overview: 'A carbon credit market on your Pirento wallet, and plantation drives whose trees grow credits for you.',
    highlights: [
      {title: 'Carbon trading', body: 'Buy and sell carbon credits from your wallet, with the price on a live chart.'},
      {
        title: 'Invest in trees',
        body: 'Pay for trees on a drive and we plant them for you. They grow carbon credits to hold or sell, with a certificate.',
      },
      {
        title: 'Donate trees',
        body: '₹500 a tree, planted as a gift to the planet, with a Pirento Foundation certificate. No credits.',
      },
    ],
    caveat:
      'The credit price is set by the Pirento Green team and can go down as well as up. Credits are held on Pirento; they are not a deposit or a guaranteed return.',
    status: 'now',
  },
  {
    slug: 'intern',
    name: 'Pirento Intern',
    short: 'Intern',
    quote: 'The expert in anything was once a beginner.',
    overview:
      'Learn a track, prove it in the exam, then join a 3 to 12-month programme: live classes, AI-set tasks, paid work across Pirento and a graded certificate.',
    highlights: [
      {
        title: 'Programmes',
        body: '3, 6, 9 or 12 months of lessons, recorded videos, live classes and daily, weekly and monthly tasks.',
      },
      {
        title: 'Paid work',
        body: 'Eligible interns get real work from across Pirento, reviewed and paid into their wallet on approval.',
      },
      {
        title: 'Exams and certificates',
        body: 'A timed final exam per track; passing gives a certificate with a code and QR anyone can verify.',
      },
    ],
    caveat:
      'Participation does not guarantee employment, placement, accreditation or income. Paid work depends on the work available and is paid only once approved.',
    status: 'now',
  },
  {
    slug: 'ai',
    name: 'Pirento AI',
    short: 'AI',
    quote: 'The future belongs to those who prepare for it today.',
    overview:
      'Ask the Pirento assistant which service fits your need, or about your own orders, wallet, Bharat ID and Intern, in English or Hindi.',
    highlights: [
      {title: 'Knows the catalog', body: 'Answers with real Pirento services, prices and links.'},
      {
        title: 'Knows your account',
        body: 'When you ask, it reads your own orders, wallet, Bharat ID, Intern and tickets, and nobody else’s.',
      },
      {
        title: 'Everywhere you work',
        body: 'Ask from any Pirento dashboard, by typing or speaking, or attach a notice or bill to have it explained. Free daily messages, more with a plan.',
      },
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
    caveat: 'Commission depends on your plan’s rate and on orders being completed. No income is guaranteed.',
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
