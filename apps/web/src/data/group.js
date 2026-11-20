// The company behind Pirento: its people, story, ventures and the bodies alongside it. Copy only; pages render it.
// Sources: the Pirento Foundation and JBC Seva Trust profiles, the Pirento Blank and Venturecore Billing guides,
// the Vakilsearch business partner agreement, and the ventures' own websites.

// People. `photo` is a file in public/team/; without one the page shows initials.
// `site` is shown as the domain; `href` is where it opens today.
// shortcut: portfolio links open the vercel.app copies, switch href to the domain once it is live.
export const PEOPLE = {
  ravikant: {
    name: 'Ravikant Soni',
    role: 'Founder & Director',
    body: 'Founded Venturecore Solutions and the Pirento ecosystem. Co-founder of Shri Sarraf and managing trustee of JBC Seva Trust.',
    photo: '/team/ravikant-soni.jpg',
    site: 'ravikantsoni.in',
    href: 'https://portfolio-rks.vercel.app/',
  },
  aman: {
    name: 'Aman Tiwari',
    role: 'Co-founder · A T Elevator and A T Facility',
    body: 'Co-founded the company with Ravikant Soni. Now leads A T Elevator and A T Facility, the company’s ventures.',
  },
  jangBahadur: {
    name: 'Jang Bahadur Chaudhary',
    role: 'Director',
    body: 'Joined the board as a director.',
  },
  ashish: {
    name: 'Ashish Soni',
    role: 'Director',
    body: 'Joined the board as a director.',
  },
  rajneesh: {
    name: 'Rajneesh Kumar',
    role: 'Member · Full stack developer',
    body: 'Builds web applications and backend systems with React, Node.js and MongoDB.',
    photo: '/team/rajneesh-kumar.jpg',
    site: 'rajneesh.work',
    href: 'https://rajneeshkumar-dev.vercel.app/',
  },
  shriKant: {
    name: 'Shri Kant',
    role: 'Member · Shri Sarraf',
    body: 'Runs Shri Sarraf, the jewellery business, with Ravikant Soni.',
  },
  dharmendra: {
    name: 'Dharmendra Kumar',
    role: 'Inzario Space',
    body: 'Leads Inzario Space, the company’s interior design venture.',
  },
};

export const COMPANY = {
  name: 'Venturecore Solutions Private Limited',
  short: 'Venturecore',
  // The year comes from the CIN, which encodes the year of incorporation.
  founded: '2023',
};

export const FOUNDATION = {
  name: 'Pirento Foundation',
  // shortcut: opens the vercel.app copy of the Foundation site; switch to its own domain once it has one.
  href: 'https://client-sigma-liart.vercel.app/',
  tagline: 'People. Planet. Possibility.',
  body: 'The social-impact arm of Venturecore Solutions Private Limited, with the company’s directors as its first trustees. It starts in Basti and eastern Uttar Pradesh.',
  // The profile asks for this until registration and 80G approval arrive.
  status: 'Registration pending. No tax exemption is offered yet.',
  programmes: [
    {
      title: 'Pirento Green',
      body: 'Native trees that survive: geotagged sites, survival checks at 6, 12 and 24 months.',
    },
    {title: 'Food and relief', body: 'Ration kits and meals for verified households; relief in floods and cold waves.'},
    {title: 'Education', body: 'Scholarships, school kits, digital access and skill courses for youth.'},
    {
      title: 'Health and livelihood',
      body: 'Health camps with qualified doctors; livelihood training for women and youth.',
    },
  ],
};

// Ventures run with the company. `href` only where a site is live.
export const VENTURES = [
  {
    name: 'A T Elevator',
    domain: 'atelevator.com',
    href: 'https://at-elevator.vercel.app/',
    tagline: 'Moving you forward. Safely. Smoothly. Reliably.',
    body: 'Passenger, home, glass, hydraulic and parking lifts in Lucknow: installation, annual maintenance, repair and modernisation.',
    lead: 'aman',
  },
  {
    name: 'A T Facility',
    tagline: 'Clean spaces, better places.',
    body: 'Housekeeping, cleaning services, hygiene solutions and maintenance support.',
    lead: 'aman',
  },
  {
    name: 'Inzario Space',
    domain: 'inzariospace.com',
    href: 'https://inzariospace.com/',
    tagline: 'Spaces that feel like you.',
    body: 'Interior design in Lucknow: homes, shops and offices, space planning and 3D visualisation.',
    lead: 'dharmendra',
  },
];

// The company's own working tools, outside the ten Pirento products.
export const TOOLS = [
  {
    name: 'Pirento Blank',
    body: 'A private trading journal and planning tool for Indian share-market traders: net P&L after charges, risk checks and trade reviews. It gives no investment advice.',
  },
  {
    name: 'Venturecore Billing',
    body: 'Quotations, invoices, payments, GST and finance for every business in the group, each with its own data, logo and payment gateway.',
  },
];

// Not part of the company: shown so visitors see the whole family, each labelled for what it is.
export const ALONGSIDE = [
  {
    name: 'Shri Sarraf',
    domain: 'shrisarraf.com',
    href: 'https://shrisarraf.com/',
    tagline: 'Crafting timeless elegance.',
    body: 'A jewellery business run by Ravikant Soni and Shri Kant.',
    note: 'Family business',
  },
  {
    name: 'JBC Seva Trust',
    domain: 'jbcsevatrust.org',
    tagline: 'Serving humanity. Preserving nature.',
    body: 'A public charitable trust for elder care, marriage support for girls from poor families, child education and nutrition, and tree plantation. Ravikant Soni is a trustee.',
    note: 'Independent trust, not part of Venturecore',
  },
];

export const PARTNER = {
  name: 'Vakilsearch',
  body: 'Venturecore Solutions Private Limited is a business partner of Vakilsearch (Uber9 Business Process Services Pvt. Ltd.), the online platform for company, legal and accounting services.',
};

// The About page story, in order. `people` are keys of PEOPLE, shown with their photos.
export const STORY = [
  {title: 'Two founders', body: 'Ravikant Soni and Aman Tiwari start out together.', people: ['ravikant', 'aman']},
  {
    title: 'Venturecore Solutions Private Limited',
    body: 'The company is incorporated in Uttar Pradesh, with its founders as directors.',
    tag: COMPANY.founded,
  },
  {
    title: 'A new director',
    body: 'Aman Tiwari steps down from the board. Jang Bahadur Chaudhary joins as director.',
    people: ['jangBahadur'],
  },
  {
    title: 'The team grows',
    body: 'Ashish Soni joins as director; Rajneesh Kumar and Shri Kant join as members.',
    people: ['ashish', 'rajneesh', 'shriKant'],
  },
  {title: 'Pirento Foundation', body: 'The company sets up its social-impact arm. Registration is pending.'},
  {title: 'Pirento Ecosystem', body: 'Venturecore launches its consumer brand: ten products on one account.'},
  {
    title: 'Three ventures',
    body: 'A T Elevator and A T Facility, led by Aman Tiwari, and Inzario Space, led by Dharmendra Kumar.',
    people: ['aman', 'dharmendra'],
  },
  {
    title: 'Tools for the group',
    body: 'Pirento Blank for traders, and Venturecore Billing for every business’s invoices.',
  },
];

export const ABOUT = {
  title: 'The people / behind Pirento.',
  intro:
    'Pirento Ecosystem is a brand of Venturecore Solutions Private Limited, a company from Basti, Uttar Pradesh. This is who runs it, how it grew, and what sits alongside it.',
  founders: {label: 'Founders', title: 'Where it / started.'},
  story: {label: 'Our story', title: 'How it / came together.'},
  structure: {label: 'The group', title: 'One company, / many parts.'},
  people: {label: 'People', title: 'Who does / the work.'},
  partner: {label: 'Partner', title: 'Who we / work with.'},
};

// Home and About: every part of the family as one card, in this order. `kind` is the card's small label.
export const FAMILY = [
  {...FOUNDATION, kind: 'Foundation', tagline: FOUNDATION.tagline, featured: true},
  ...VENTURES.map((v) => ({...v, kind: 'Venture'})),
  ...ALONGSIDE.map((a) => ({...a, kind: a.note, note: undefined})),
  ...TOOLS.map((t) => ({...t, kind: 'Tool'})),
];
