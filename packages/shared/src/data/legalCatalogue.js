/** Slug derivation must match CategoryBlock's, which builds the page's links. */
export function legalServiceSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export const LEGAL_CATALOGUE = [
  {
    title: 'Business Setup & Registration',
    services: [
      'Private Limited Company',
      'LLP Registration',
      'OPC',
      'Sole Proprietorship',
      'Partnership Firm',
      'Nidhi Company',
      'Producer Company',
      'Startup India Registration',
    ],
  },
  {
    title: 'Licenses & Registrations',
    services: ['Udyam (MSME)', 'FSSAI', 'IEC', 'Trade License', 'ISO', 'BIS', 'Hallmark', 'DSC'],
  },
  {
    title: 'GST & Taxation',
    services: ['GST Registration', 'GST Filing', 'GST Cancellation', 'GST Revocation', 'HSN Code Finder'],
  },
  {
    title: 'Accounting & Financial',
    services: [
      'Accounting',
      'TDS Filing',
      'ITR Filing',
      'Proprietorship Tax',
      'LLP Tax',
      'Corporate Tax',
      'Tax Assessment',
      'Tax Notice',
      'Reply to Notice',
      'Virtual CFO',
    ],
  },
  {
    title: 'Compliance',
    services: [
      'Annual Compliance',
      'LLP Filing',
      'Secretarial Audit',
      'Compliance Check',
      'Due Diligence',
      'RBI Compliance',
    ],
  },
  {
    title: 'Company Changes',
    services: [
      'Add Director',
      'Remove Director',
      'Increase Capital',
      'Change Name',
      'Change Address',
      'Change Objective',
      'Close Company',
      'Strike Off',
      'Close LLP',
      'Add Partner',
      'Change LLP Agreement',
    ],
  },
  {
    title: 'IPR',
    services: [
      'Trademark Registration',
      'Trademark Search',
      'TM Objection',
      'TM Renewal',
      'TM Assignment',
      'TM Watch',
      'Well Known TM',
      'Copyright Registration',
      'Patent Search',
      'Provisional Patent',
      'Patent Registration',
      'TM Infringement',
      'Copyright Infringement',
      'Patent Infringement',
    ],
  },
  {
    title: 'Legal Notices',
    services: ['Legal Notice', 'Money Recovery', 'Cheque Bounce', 'Consumer Notice', 'Tenant Notice'],
  },
  {
    title: 'Legal Documents',
    services: ['Agreements', 'Contracts', 'Drafting', 'Policies', 'Affidavits'],
  },
  {
    title: 'Labour Law',
    services: ['PF', 'ESI', 'Professional Tax', 'Shop License', 'ESOP', 'POSH', 'Labour Compliance', 'Labour Advisor'],
  },
  {
    title: 'Litigation',
    services: [
      'Criminal Lawyer',
      'Divorce Lawyer',
      'Family Lawyer',
      'Banking Lawyer',
      'Consumer Lawyer',
      'Labour Lawyer',
      'Litigation Lawyer',
      'IP Lawyer',
      'Trademark Lawyer',
      'TMT',
      'Risk Advisory',
    ],
  },
  {
    title: 'Consultation & Support',
    services: [
      'Talk to Lawyer',
      'Talk to CA',
      'Talk to CS',
      'Talk to IP Lawyer',
      'Consumer Complaint',
      'Online Complaint',
      'Corporate Immigration',
      'Family Immigration',
      'Student Immigration',
      'Immigration Lawyer',
      'Pitch Deck',
      'Business Loan',
      'DPR',
    ],
  },
];

/** Flat list of every catalogue entry with its page slug. */
export const LEGAL_SERVICES = LEGAL_CATALOGUE.flatMap((c) =>
  c.services.map((name) => ({name, slug: legalServiceSlug(name), category: c.title})),
);
