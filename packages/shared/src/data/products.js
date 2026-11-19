// The ten Pirento products. Every line here describes what the product does
// today and what it does not do yet. Keep it that way: no numbers or claims
// that are not true.

const steps = [
  {title: 'Explore', body: 'Browse the catalog and read what each feature does.'},
  {title: 'Sign in', body: 'Use one Pirento account for every product, records and tools.'},
  {title: 'Ask for help', body: 'Raise a support request whenever you need a person.'},
];

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
    overview: 'Prepare document drafts and view tax and filing records managed by our team.',
    highlights: [
      {
        title: 'Document drafts',
        body: 'Prepare and preview drafts from the available templates. Review them before you rely on them.',
      },
      {title: 'Filing records', body: 'Track submitted information and filing progress.'},
      {title: 'Existing documents', body: 'Access the documents available to your account.'},
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
    overview: 'Use AI conversation tools, keep saved chats and set up simple automation rules.',
    highlights: [
      {title: 'Conversations', body: 'Chat with AI tools and keep saved conversations. Review every output.'},
      {title: 'Automation rules', body: 'Set up trigger and action rules. Money actions stay switched off.'},
      {title: 'Account context', body: 'Tools can use your account records within the scope you allow.'},
    ],
    caveat: 'AI output needs review. No unlimited usage or predictive accuracy is promised.',
    status: 'expected',
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
    overview: 'Manage your partner client records and view orders and sales.',
    highlights: [
      {title: 'Client records', body: 'Keep the records of the clients you bring.'},
      {title: 'Service discovery', body: 'Browse the service catalog and existing orders.'},
      {title: 'Sales history', body: 'View recorded partner sales and their status.'},
    ],
    caveat: 'Commission settlement is not available yet. No income is guaranteed.',
    status: 'expected',
  },
  {
    slug: 'capital',
    name: 'Pirento Capital',
    short: 'Capital',
    quote: "Capital isn't scarce; vision is.",
    overview: 'View loan and repayment records in our lending application.',
    highlights: [
      {title: 'Loan records', body: 'View loan requests, repayments and investment records.'},
      {title: 'Simple pricing', body: 'Fixed risk grades and simple-interest calculations.'},
      {title: 'Account support', body: 'Contact support about any record.'},
    ],
    caveat:
      'Lending is not available yet. This is not proof of regulatory authorization, guaranteed returns or deposit protection.',
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
    overview: 'Browse the gift catalog, plan a gift and view your gift orders.',
    highlights: [
      {title: 'Gift discovery', body: 'Browse the catalog and explore gift suggestions.'},
      {title: 'Recipient details', body: 'Prepare recipient and occasion details.'},
      {title: 'Order records', body: 'View gift orders and their progress.'},
    ],
    caveat: 'Delivery dates, inventory and corporate partnerships are not guaranteed.',
    status: 'expected',
  },
].map((p) => ({...p, steps}));

export const getProduct = (slug) => PRODUCTS.find((p) => p.slug === slug) ?? null;
