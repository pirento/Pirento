// The AI tools shown in each product (the words; the server checks every field). Kinds match the AI service's
// /assist/:kind. `fields`: [name, label, type?, options?]; type 'area', 'number', 'select', 'file' or text.
const LANG = ['language', 'Language', 'select', ['English', 'Hindi', 'Hinglish']];

export const AI_TOOLS = {
  recommend: {
    title: 'Find the right service',
    intro: 'Say what you need in your own words; Pirento AI picks from our services, with a reason.',
    fields: [['need', 'What do you need?', 'area']],
  },
  giftPick: {
    kind: 'recommend',
    title: 'Find the right gift',
    intro: 'Who it is for and your budget; Pirento AI picks gift boxes that fit.',
    fields: [
      ['forWhom', 'Who is it for? (e.g. my mother, a colleague)'],
      ['budget', 'Budget (₹)', 'number'],
      ['need', 'Occasion and what they like', 'area'],
    ],
  },
  monthly: {
    title: 'My month, summed up',
    intro: 'What got done, what is pending and what to do next, across every Pirento product.',
    fields: [LANG],
  },
  draftDoc: {
    title: 'Draft a document',
    intro: 'A first draft to start from. A lawyer must check it before anyone signs.',
    fields: [
      [
        'docType',
        'Document',
        'select',
        [
          'Rent agreement',
          'Non-disclosure agreement (NDA)',
          'Legal notice',
          'Partnership deed',
          'Affidavit',
          'Employment offer letter',
        ],
      ],
      ['parties', 'Who is it between? (names, cities)', 'area'],
      ['details', 'Key details (rent, dates, terms…)', 'area'],
      LANG,
    ],
  },
  explainDoc: {
    title: 'Explain a notice or letter',
    intro:
      'Upload a photo or PDF (up to 5 MB). Pirento AI says what it is, what it asks, any date and amount, and what to do. The file is not stored.',
    fields: [['file', 'Notice, letter or bill', 'file'], ['question', 'Anything specific to ask? (optional)'], LANG],
  },
  compliance: {
    title: 'My filing dates',
    intro:
      'Pick what applies to you; Pirento AI lists the usual due dates for the next three months. Always confirm on the official portal.',
    fields: [
      [
        'items',
        'What applies to you',
        'multi',
        [
          'GST monthly (GSTR-1, GSTR-3B)',
          'GST quarterly (QRMP)',
          'Income tax: individual',
          'Income tax: business with audit',
          'TDS returns',
          'Company annual filing (ROC)',
        ],
      ],
    ],
  },
  greenImpact: {
    title: 'My planting report',
    intro: 'Your tree sponsorships in a short report, from your orders only.',
    fields: [LANG],
  },
  csrReport: {
    title: 'Draft a CSR section',
    intro: 'For your company report, from your Pirento Green sponsorships. Blanks are left for what only you know.',
    fields: [
      ['company', 'Company name'],
      ['year', 'Year (e.g. 2026-27)'],
      ['notes', 'Anything to add (optional)', 'area'],
    ],
  },
  giftMessage: {
    title: 'Write the gift message',
    intro: 'Three short messages to choose from.',
    fields: [
      ['to', 'For'],
      ['occasion', 'Occasion'],
      ['tone', 'Tone', 'select', ['Warm', 'Funny', 'Formal', 'Romantic']],
      ['from', 'From (optional)'],
      LANG,
    ],
  },
  shareMessage: {
    title: 'Write my share message',
    intro: 'Three honest messages to share your code, for the platform you pick.',
    fields: [
      ['platform', 'Where', 'select', ['WhatsApp', 'Instagram', 'Facebook', 'LinkedIn', 'SMS']],
      ['audience', 'Who are you sharing with?'],
      LANG,
    ],
  },
  partnerCoach: {
    title: 'Coach me',
    intro: 'What your referrals buy, and what to share next.',
    fields: [LANG],
  },
  emiExplain: {
    title: 'Explain an EMI',
    intro:
      'The EMI from the calculator, explained in plain words with two ways to pay less. Pirento Capital has not started lending yet.',
    fields: [LANG],
  },
  devHelp: {
    title: 'Ask how to build it',
    intro: 'A question about the API; Pirento AI answers with a working example. Keep keys out of your code.',
    fields: [
      ['question', 'Your question', 'area'],
      ['language', 'Language', 'select', ['JavaScript', 'Python', 'PHP', 'Java', 'cURL']],
    ],
  },
  tutor: {
    title: 'Explain this lesson',
    intro: 'Ask about anything you did not follow, or leave it empty for a simple explanation and more practice.',
    fields: [['question', 'Your question (optional)', 'area']],
  },
  idHelp: {
    title: 'Help with this step',
    intro: 'What this step needs and where to find it. Never type your numbers here; only in the form.',
    fields: [['question', 'Your question (optional)']],
  },
  impactStory: {
    title: 'Pirento Foundation story',
    intro: 'Facts in, a short story out. Only the facts you give are used.',
    fields: [
      ['facts', 'Facts (what, where, when, how many)', 'area'],
      ['audience', 'For', 'select', ['Website', 'Donors', 'Social media', 'Annual report']],
    ],
  },
  adminAnswer: {
    title: 'Ask about today',
    intro: 'Live figures for the areas your role can see: orders, tickets, Bharat ID, withdrawals, Intern.',
    fields: [['question', 'Your question (e.g. how many orders are late?)', 'area']],
  },
};

/** Which tools each product shows, and fixed values sent with them. */
export const AI_TOOLS_FOR = {
  ecosystem: [['monthly'], ['recommend']],
  legal: [['recommend', {product: 'legal'}], ['draftDoc'], ['explainDoc', {product: 'legal'}]],
  black: [['explainDoc', {product: 'black'}], ['compliance'], ['recommend', {product: 'black'}]],
  green: [['greenImpact'], ['csrReport']],
  giftox: [['giftPick', {product: 'giftox'}], ['giftMessage']],
};
