// The company behind Pirento: its people, story, ventures and the bodies alongside it. Copy only; pages render it.
// Sources: the Pirento Foundation and JBC Seva Trust profiles, the Pirento Blank and Pirento INV guides,
// the Vakilsearch business partner agreement, and the ventures' own websites.

// People. `photo` is a file in public/team/; without one the page shows initials. `face` is a square crop of the
// photo for the small round avatars, for a photo where the face is small in the frame.
// `site` is shown as the domain; `href` is where it opens today.
// shortcut: portfolio links open the vercel.app copies, switch href to the domain once it is live.
export const PEOPLE = {
  ravikant: {
    name: 'Ravikant Soni',
    role: 'Founder & Director',
    body: 'Founded Venturecore Solutions and the Pirento ecosystem. Co-founder of Shri Sarraf and managing trustee of JBC Seva Trust.',
    photo: '/team/ravikant-soni.jpg',
    face: '/team/ravikant-soni-face.jpg',
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
    name: 'Shri Kant Soni',
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
  place: 'Basti, Uttar Pradesh',
  programmes: [
    {
      title: 'Pirento Green',
      icon: 'tree',
      body: 'Native trees that survive: geotagged sites, survival checks at 6, 12 and 24 months.',
    },
    {
      title: 'Food and relief',
      icon: 'food',
      body: 'Ration kits and meals for verified households; relief in floods and cold waves.',
    },
    {
      title: 'Education',
      icon: 'school',
      body: 'Scholarships, school kits, digital access and skill courses for youth.',
    },
    {
      title: 'Health and livelihood',
      icon: 'health',
      body: 'Health camps with qualified doctors; livelihood training for women and youth.',
    },
  ],
};

// Ventures run with the company. `href` only where a site is live.
export const VENTURES = [
  {
    name: 'A T Elevator',
    icon: 'elevator',
    meta: 'Lifts · Lucknow',
    domain: 'atelevator.com',
    href: 'https://at-elevator.vercel.app/',
    tagline: 'Moving you forward. Safely. Smoothly. Reliably.',
    body: 'Passenger, home, glass, hydraulic and parking lifts in Lucknow: installation, annual maintenance, repair and modernisation.',
    lead: 'aman',
  },
  {
    name: 'A T Facility',
    icon: 'facility',
    meta: 'Housekeeping and upkeep',
    tagline: 'Clean spaces, better places.',
    body: 'Housekeeping, cleaning services, hygiene solutions and maintenance support.',
    lead: 'aman',
  },
  {
    name: 'Inzario Space',
    icon: 'interior',
    meta: 'Interior design · Lucknow',
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
    icon: 'journal',
    meta: 'Tool · Traders',
    domain: 'pirento.in',
    body: 'A trading journal, plans, risk limits, an AI coach and live broker orders in one place for NSE traders, on phone and desktop, in Hindi and English. It gives no investment advice.',
  },
  {
    name: 'Pirento INV',
    icon: 'billing',
    meta: 'Tool · Every business',
    body: 'Billing and accounts for every business in the group: invoices, quotations, payments, GST and finance, each business with its own data, logo, email and payment gateway.',
  },
];

// The two tools as big panels on the Pirento home, in their own colours (PANEL_COLOURS in brand.js). Every line is
// from the owner's brief of each app.
export const TOOL_PANELS = [
  {
    key: 'blank',
    name: 'Pirento Blank',
    side: ['Web app for NSE traders', 'Hindi and English'],
    status: 'pirento.in · not live yet',
    title: ['Plan it.', 'Check it.', 'Then trade.'],
    body: 'For intraday (MIS) and delivery (CNC) traders who want their losses kept in check: a trading journal, plans, risk limits, an AI coach and live orders through your broker, in one place. On phone and desktop, in Hindi and English. It gives no investment advice.',
    items: [
      {
        icon: 'book',
        title: 'Journal and trade book',
        body: 'Every trade: entry, exit, P&L, charges, notes, mistakes and emotion; CSV, Excel or broker fills.',
      },
      {
        icon: 'calculator',
        title: 'Calculator',
        body: 'The right quantity from your risk % and stop-loss, with charges, against your broker balance.',
      },
      {
        icon: 'review',
        title: 'Order review',
        body: 'Save a plan, have the AI check it against your rules, then send it; exit or set a stop-loss / target GTT later.',
      },
      {
        icon: 'shield',
        title: 'Risk limits',
        body: 'A daily loss limit and a trades-per-day limit; once one is hit, new orders stop.',
      },
      {
        icon: 'broker',
        title: 'Five brokers',
        body: 'Zerodha, Dhan, Upstox, Fyers and Angel One: portfolio, balance and orders.',
      },
      {
        icon: 'chart',
        title: 'Reports',
        body: 'P&L, win rate, calendar, insights, a weekly report, a tax report and analytics, by strategy too.',
      },
      {
        icon: 'ai',
        title: 'AI coach',
        body: 'Chat, trade review, a pre-market briefing, research and journal search.',
      },
      {
        icon: 'tools',
        title: 'Market tools',
        body: 'Watchlist, live chart, price alerts, option chain, backtest and paper trading.',
      },
    ],
    note: 'Live trading: switched on by an admin on the server and by each member for themselves. Every order is a LIMIT order, never a market order, sent after MFA, a symbol check and a broker balance check; one plan sends one order, under a daily order limit.',
  },
  {
    key: 'inv',
    name: 'Pirento INV',
    side: ['Billing and accounts', 'Venturecore / Pirento group'],
    status: 'For the group’s businesses',
    title: ['Every invoice.', 'Every business.', 'One workspace.'],
    body: 'The Venturecore / Pirento group’s billing and accounts app. Every business in the group (A T Elevator, Inzario Space, Shri Sarraf, Pirento Legal and more) runs from one place, and every login sees only what it has been given.',
    items: [
      {
        icon: 'invoice',
        title: 'Every document',
        body: 'Tax invoice, quotation, proforma, delivery challan, and credit and debit notes; unit and GST from a list.',
      },
      {
        icon: 'ai',
        title: 'GST from the HSN code',
        body: 'Type the HSN code and the AI suggests the right GST rate; add a new customer on the spot.',
      },
      {
        icon: 'pdf',
        title: 'PDF on the letterhead',
        body: 'Every document as a clean PDF with the business’s own logo and letterhead.',
      },
      {
        icon: 'mail',
        title: 'Email in its own name',
        body: 'Sent in the business’s own name and colours with the PDF and a Razorpay payment link; payment, reminder and receipt emails go by themselves.',
      },
      {
        icon: 'chart',
        title: 'Finance dashboard',
        body: 'Sales, money received, outstanding, expenses, profit and GST for every business; Excel or PDF; bank statements matched with AI.',
      },
      {
        icon: 'team',
        title: 'Team logins',
        body: 'Staff, Finance and Business owner; an owner changes their own business’s settings.',
      },
      {
        icon: 'lock',
        title: 'Settings kept locked',
        body: 'Each business’s SMTP email, Razorpay or Cashfree gateway and OpenAI key, stored encrypted.',
      },
      {
        icon: 'more',
        title: 'And the rest',
        body: 'Customer ledger, payment reminders, recurring invoices, expenses, GSTR-1, reports, stock, e-invoice and e-way bill JSON, backups.',
      },
    ],
    note: 'Works on a phone too, with large, clear buttons.',
  },
];

// Not part of the company: shown so visitors see the whole family, each labelled for what it is.
export const ALONGSIDE = [
  {
    name: 'Shri Sarraf',
    icon: 'jewellery',
    domain: 'shrisarraf.com',
    href: 'https://shrisarraf.com/',
    tagline: 'Crafting timeless elegance.',
    body: 'A jewellery business run by Ravikant Soni and Shri Kant Soni.',
    note: 'Family business',
  },
  {
    name: 'JBC Seva Trust',
    icon: 'trust',
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
    body: 'Ashish Soni joins as director; Rajneesh Kumar and Shri Kant Soni join as members.',
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
    body: 'Pirento Blank for traders, and Pirento INV for every business’s invoices.',
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

// Home and About: the family beyond the ten products, in rows like the products above it.
export const FAMILY_GROUPS = [
  {title: 'Ventures', body: 'Businesses built and run with Venturecore.', items: VENTURES},
  {
    title: 'Run on their own',
    body: 'Close to us, with their own books and decisions.',
    items: ALONGSIDE.map(({note, ...a}) => ({...a, meta: note})),
  },
  {title: 'Tools', body: 'Software the group runs on.', items: TOOLS},
];
