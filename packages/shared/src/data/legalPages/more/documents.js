// More questions, common mistakes and benefits for the Legal Notices and Legal Documents pages (added to their sections).
const NOTICE = {
  f: [
    [
      'How is the notice sent?',
      'By registered post or speed post with tracking, and by email where you have the other side’s address. Keep the receipts.',
    ],
    ['Who signs it?', 'An advocate signs it on your behalf, after you approve the final text.'],
  ],
  m: ['Leaving out the documents the notice refers to'],
  b: [['A record for later', 'The notice and its delivery proof help if the matter goes to court.']],
};

const DRAFT = {
  f: [
    ['How many revisions do I get?', 'The ones the package lists; further rounds are quoted before they start.'],
    [
      'Will the document be valid in every state?',
      'The terms work across India; stamp duty and registration follow the state where it is signed or the property sits.',
    ],
  ],
  m: ['Signing without reading the final version against what was agreed'],
  b: [
    ['Fewer disputes', 'Clear terms leave less room for argument later.'],
    ['Reusable', 'A well-drafted document can serve as your template for similar deals.'],
  ],
};

export const MORE_DOCUMENTS = {
  'legal-notice': {
    ...NOTICE,
    f: [
      ...NOTICE.f,
      [
        'How long should I wait for a reply?',
        'The notice sets a period, often 15 to 30 days, before you take the next step.',
      ],
    ],
  },
  'money-recovery': {
    ...NOTICE,
    f: [
      ...NOTICE.f,
      [
        'Is there a time limit to recover money?',
        'Usually three years from when the money became due, under the Limitation Act; some debts differ.',
      ],
    ],
  },
  'cheque-bounce': {
    f: [
      [
        'When can a case be filed?',
        'If the amount is not paid within 15 days of the drawer receiving the notice, a complaint can be filed within one month after that.',
      ],
      ['What do I need?', 'The cheque, the bank’s return memo and proof that the notice was sent and received.'],
    ],
    m: ['Presenting the cheque after its validity has ended'],
    b: [
      ['Strong remedy', 'Section 138 of the Negotiable Instruments Act makes a bounced cheque a criminal offence.'],
      ['Often settles', 'Many payers pay once a proper notice arrives.'],
    ],
  },
  'consumer-notice': {
    ...NOTICE,
    f: [
      ...NOTICE.f,
      [
        'Can I file online?',
        'Yes, a consumer complaint can be filed on the e-Daakhil portal if the notice does not settle it.',
      ],
    ],
  },
  'tenant-notice': {
    ...NOTICE,
    f: [
      ...NOTICE.f,
      [
        'Can I change the locks after the notice?',
        'No. A landlord should not force a tenant out; if they do not leave, the remedy is through the court or rent authority.',
      ],
    ],
  },
  agreements: DRAFT,
  contracts: DRAFT,
  drafting: DRAFT,
  policies: {
    f: [
      [
        'Which policies does a website need?',
        'Usually terms of use, a privacy policy and a refund policy; payment gateways ask for these before going live.',
      ],
      ...DRAFT.f.slice(0, 1),
    ],
    m: ['A privacy policy that does not describe the data you actually collect'],
    b: DRAFT.b,
  },
  affidavits: {
    f: [
      [
        'Does an affidavit need a notary?',
        'Most do: it is signed before a notary or an oath commissioner. We tell you which one yours needs.',
      ],
      [
        'Which stamp paper value?',
        'It depends on your state and the purpose; we tell you the value before you buy it.',
      ],
    ],
    m: ['Signing before the notary without the original ID'],
    b: [
      ['Accepted where you submit it', 'The wording follows what the office or court asks for.'],
      ['Quick', 'Most affidavits are ready within a day or two.'],
    ],
  },
};
