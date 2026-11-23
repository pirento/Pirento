// More "who it is for", "included", documents, steps, deliverables and questions for the Setup, Licences, Tax,
// Compliance and company-change pages (w, i, doc, s, out, f), added after each page's own lines.
const ROC_CHANGE = {
  doc: ['The board or members’ resolution, once passed'],
  s: [['Recorded', 'The Registrar approves the form and the change shows on the MCA master data.']],
  out: ['The updated company master data on MCA'],
};

const CLOSE_W = ['Founders who no longer want yearly filings and fees'];

export const MORE_SECTIONS_BUSINESS = {
  'private-limited-company': {
    f: [
      [
        'Can a foreigner or NRI be a shareholder?',
        'Yes, under the automatic route for most sectors, with RBI reporting after the shares are issued.',
      ],
    ],
  },
  'llp-registration': {
    i: ['Drafting of the LLP agreement'],
    f: [
      [
        'Can an LLP raise investment?',
        'Partners can bring capital, but an LLP cannot issue shares the way a company can.',
      ],
    ],
  },
  opc: {
    w: ['Professionals who want limited liability on their own'],
    i: ['MOA and AOA drafted for a one-person company'],
    s: [['Certificate', 'You receive the incorporation certificate with the company’s PAN and TAN.']],
  },
  'sole-proprietorship': {
    out: ['Help opening a current account in the business name'],
  },
  'nidhi-company': {
    w: ['Communities and associations with regular savers', 'Founders who want a regulated lending model'],
    f: [
      [
        'What must a Nidhi do after incorporation?',
        'Reach the member and net owned fund levels in the Nidhi Rules and file the returns they ask for, on time.',
      ],
    ],
  },
  'producer-company': {
    f: [
      [
        'Is a producer company the same as a cooperative?',
        'No. It is registered under the Companies Act and follows its filings, while keeping member ownership like a cooperative.',
      ],
    ],
  },
  'startup-india-registration': {
    w: ['Startups planning to seek tax or IP benefits', 'Founders bidding for government tenders'],
    out: ['Your Startup India recognition number'],
  },
  'udyam-msme': {
    w: ['Businesses selling to government buyers or large companies'],
    i: ['A check of the investment and turnover figures used'],
    out: ['Your Udyam registration number', 'A note of the yearly update it needs'],
    s: [['Keep it current', 'Details refresh from your tax returns; we tell you if anything needs changing.']],
  },
  fssai: {
    i: ['Follow-up with the food safety officer until it is granted'],
    out: ['A note of the display and labelling rules'],
  },
  iec: {
    w: ['Service exporters receiving foreign payments'],
    i: ['A check that your PAN and bank details match'],
    out: ['Your 10-digit IEC number', 'A reminder of the yearly update window'],
    s: [['Yearly update', 'Each year between April and June the IEC details are confirmed online.']],
  },
  'trade-license': {
    i: ['Help with the inspection, if one is fixed'],
    out: ['A note of what to display at the premises'],
  },
  iso: {
    out: ['A note of the surveillance audit dates'],
  },
  bis: {
    out: ['The test report from the BIS-recognised lab'],
  },
  hallmark: {
    w: ['New jewellery stores opening in hallmarking districts'],
    i: ['Guidance on the HUID and display rules'],
    out: ['A note of the display and HUID rules'],
    s: [['Display', 'Show the registration and follow the hallmarking rules for each piece sold.']],
  },
  dsc: {
    i: ['A USB token to hold the certificate'],
    out: ['The USB token with your DSC'],
    s: [['Use', 'Plug in the token to sign on MCA, GST or income tax portals.']],
  },
  'gst-registration': {
    i: ['Replies to any clarification asked by the officer'],
  },
  'gst-filing': {
    w: ['Online sellers and service providers registered under GST'],
    i: ['Reconciliation of your purchase credit with GSTR-2B'],
    out: ['A reminder of the next due dates'],
  },
  'gst-cancellation': {
    out: ['A reminder of the final return (GSTR-10) date'],
  },
  'gst-revocation': {
    w: [
      'Businesses that missed returns and now want to trade again',
      'Anyone whose GSTIN was suspended for non-filing',
    ],
    out: ['Your active GSTIN', 'A plan to keep returns on time'],
  },
  'hsn-code-finder': {
    doc: ['Your current invoices, if you already sell'],
    out: ['The GST rate for each code', 'A note of any notifications that change the rate'],
    s: [['Use', 'Put the codes on your invoices and in your returns.']],
  },
  accounting: {
    out: ['Ledgers and a trial balance on request'],
    f: [
      [
        'Do you file my GST and TDS too?',
        'They are separate services; we can do them together so the books and returns match.',
      ],
    ],
  },
  'tds-filing': {
    i: ['Check of PANs and challans before filing'],
    out: ['A reminder of the next quarter’s due dates'],
  },
  'itr-filing': {
    i: ['Check of your AIS and Form 26AS before filing'],
    out: ['A note of any tax due or refund expected'],
  },
  'proprietorship-tax': {
    w: ['Small shops and traders'],
    i: ['Check of AIS and Form 26AS before filing'],
    out: ['A note of advance tax for next year'],
  },
  'llp-tax': {
    w: ['LLPs with business income', 'LLPs that need a tax audit'],
    i: ['Check of partners’ remuneration and interest limits'],
    out: ['A note of advance tax for next year'],
  },
  'corporate-tax': {
    w: ['Companies needing a tax audit'],
    out: ['A note of advance tax for next year'],
  },
  'tax-assessment': {
    w: ['Businesses facing an assessment under faceless proceedings'],
    i: ['Drafting and filing replies once you approve the quote'],
    out: ['A note on appeal options if the order goes against you'],
  },
  'tax-notice': {
    w: ['Businesses with a GST notice', 'Anyone with a demand they think is wrong'],
    i: ['A check that the notice is genuine'],
    out: ['A note of any next step or date'],
  },
  'reply-to-notice': {
    w: ['Anyone asked to explain a mismatch in their return', 'Taxpayers with a hearing fixed'],
    i: ['Representation at the hearing, where the package covers it'],
    out: ['A note of any follow-up the officer asks for'],
  },
  'virtual-cfo': {
    w: ['Founders who want help with numbers and investors'],
    i: ['Monthly review of books, cash flow and budget, once you take the retainer'],
    out: ['A monthly call to review the numbers'],
    s: [['Review', 'Each month we look back at the numbers and agree next steps.']],
  },
  'annual-compliance': {
    w: ['Companies with an auditor already appointed', 'Founders who want one team for every yearly filing'],
  },
  'llp-filing': {
    w: ['LLPs that want both annual forms filed together', 'Partners who need their KYC filed'],
    i: ['Partners’ KYC where it is due'],
    out: ['A reminder of next year’s due dates'],
  },
  'secretarial-audit': {
    w: ['Companies that want a check of their compliance'],
    i: ['Review of minutes, registers and filings for the year'],
    out: ['A list of gaps found and how to fix them'],
  },
  'compliance-check': {
    i: ['A prioritised list of what to fix first'],
    out: ['A quote to fix the gaps, if you want us to'],
    s: [['Fix', 'Choose what to fix; we quote each item before starting.']],
  },
  'due-diligence': {
    i: ['Review of corporate, tax, contracts and litigation records, as agreed'],
    doc: ['The term sheet or deal summary'],
    out: ['A summary of key risks and suggested protections'],
  },
  'rbi-compliance': {
    w: ['Startups after a foreign funding round'],
    i: ['Preparation and filing of the reports, once you take the quote'],
    out: ['A calendar of future reporting dates'],
  },
  'add-director': {
    w: ['Startups adding an investor’s nominee', 'Companies replacing a director who left'],
    ...ROC_CHANGE,
  },
  'remove-director': {
    w: ['Companies acting on a members’ resolution to remove a director', 'Directors who want their exit recorded'],
    ...ROC_CHANGE,
  },
  'increase-capital': {
    w: ['Startups before a funding round', 'Companies converting loans into shares'],
    ...ROC_CHANGE,
  },
  'change-name': {
    w: ['Companies whose name clashes with a trademark', 'Companies after a merger or new ownership'],
    ...ROC_CHANGE,
  },
  'change-address': {
    w: ['Companies moving to a new city or state', 'Startups moving out of a home office'],
    ...ROC_CHANGE,
  },
  'change-objective': {
    w: ['Companies entering a new market', 'Companies whose objects are too narrow for new work'],
    ...ROC_CHANGE,
  },
  'close-company': {
    w: CLOSE_W,
    out: ['Final order closing the company'],
  },
  'strike-off': {
    w: CLOSE_W,
    out: ['The final notice dissolving the company'],
  },
  'close-llp': {
    w: ['Partners who no longer want yearly LLP filings'],
    out: ['The final notice dissolving the LLP'],
  },
  'add-partner': {
    w: ['LLPs adding an investor', 'LLPs replacing a partner who left'],
    out: ['Updated LLP master data on MCA'],
  },
  'change-llp-agreement': {
    w: ['LLPs changing profit shares', 'LLPs adding rules for decisions or exits'],
    out: ['Updated LLP master data on MCA'],
  },
};
