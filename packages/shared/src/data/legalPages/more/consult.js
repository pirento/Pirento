// More questions, common mistakes and benefits for the Consultation & Support pages (added to their sections).
const CALL = {
  f: [
    [
      'How is the call booked?',
      'After payment, the team agrees a time with you in the order’s messages and sends the call link.',
    ],
    ['What if 30 minutes is not enough?', 'You can book another call, or ask for a quote for the full work.'],
  ],
  m: ['Bringing many unrelated questions to one short call'],
  b: [
    ['Low cost', 'Expert advice for a fixed small fee.'],
    ['From home', 'Talk by video or phone without visiting an office.'],
  ],
};

const IMMIGRATION = {
  f: [
    [
      'What happens in the consultation?',
      'We look at your profile and goal, explain the visa routes that fit, the documents and the usual timelines.',
    ],
    [
      'Do you file the application?',
      'We help prepare it; the application is decided by the embassy or immigration authority.',
    ],
  ],
  m: ['Relying on agents who promise a visa'],
  b: [
    ['Fewer refusals', 'Documents that match each other and the rules.'],
    ['A clear timeline', 'You know the steps and how long each usually takes.'],
  ],
};

export const MORE_CONSULT = {
  'talk-to-lawyer': CALL,
  'talk-to-ca': {
    ...CALL,
    f: [['What can I ask a CA?', 'Income tax, GST, accounts, audits and business finance.'], ...CALL.f],
  },
  'talk-to-cs': {
    ...CALL,
    f: [
      ['What can I ask a CS?', 'Company law, board meetings, ROC filings, share transfers and corporate changes.'],
      ...CALL.f,
    ],
  },
  'talk-to-ip-lawyer': {
    ...CALL,
    f: [['What can I ask?', 'Trademarks, copyright, designs, patents, and copying of your brand or work.'], ...CALL.f],
  },
  'consumer-complaint': {
    f: [
      ['Can I file online?', 'Yes, on the e-Daakhil portal, with the documents and the fee for your claim value.'],
      [
        'What can the commission order?',
        'A refund, replacement, repair, compensation and costs, depending on the case.',
      ],
    ],
    m: ['Claiming an amount you cannot support with bills'],
    b: [
      ['Low fees', 'Consumer commissions charge small fees, and none for smaller claims.'],
      ['Appear yourself', 'A lawyer is not compulsory at the consumer commission.'],
    ],
  },
  'online-complaint': {
    f: [
      [
        'Where are cyber crimes reported?',
        'On the National Cyber Crime Reporting Portal (cybercrime.gov.in), or at the nearest cyber police station.',
      ],
      [
        'Can money lost to fraud be recovered?',
        'Sometimes, if reported quickly so the bank can hold the funds; it is never certain.',
      ],
    ],
    m: ['Paying someone who promises to recover the money for a fee'],
    b: [
      ['Faster action', 'A complete complaint with evidence is easier for the police and banks to act on.'],
      ['Proof for your bank', 'The complaint number supports a dispute with your bank.'],
    ],
  },
  'corporate-immigration': {
    ...IMMIGRATION,
    f: [
      [
        'Which visas do you cover?',
        'Employment and business visas for staff moving abroad, and for foreign staff coming to India.',
      ],
      ...IMMIGRATION.f,
    ],
  },
  'family-immigration': {
    ...IMMIGRATION,
    f: [['Which visas do you cover?', 'Spouse, dependant and family visit visas.'], ...IMMIGRATION.f],
  },
  'student-immigration': {
    ...IMMIGRATION,
    f: [
      [
        'Do you help choose a university?',
        'We focus on the visa: documents, finances and the application. Admission is your choice and the university’s.',
      ],
      ...IMMIGRATION.f,
    ],
  },
  'immigration-lawyer': {
    ...IMMIGRATION,
    f: [
      [
        'When do I need an immigration lawyer?',
        'After a refusal, for a complex case, or when status or deportation questions arise.',
      ],
      ...IMMIGRATION.f,
    ],
  },
  'pitch-deck': {
    f: [
      [
        'What goes into the deck?',
        'Problem, solution, market, product, business model, traction, team, financials and the ask.',
      ],
      [
        'Will you write the financial projections?',
        'We shape them into the deck from your numbers; detailed financial models are a separate service.',
      ],
    ],
    m: ['Leaving out how much you are raising and what it will be spent on'],
    b: [
      ['Investor-ready', 'A structure investors are used to reading.'],
      ['Reusable', 'An editable file you update as you grow.'],
    ],
  },
  'business-loan': {
    f: [
      [
        'Which loans do you help with?',
        'Term loans, working capital, and government-backed schemes such as Mudra and CGTMSE, where you qualify.',
      ],
      [
        'What documents are needed?',
        'Usually KYC, business registrations, bank statements, tax returns and financial statements.',
      ],
    ],
    m: ['Applying before the books and returns show the income lenders look for'],
    b: [['Right lender', 'We suggest lenders and schemes that fit your profile.']],
  },
  dpr: {
    f: [
      [
        'What does a DPR contain?',
        'The project, market, technical details, cost, financing plan, projected financials and repayment ability.',
      ],
      ['Who asks for a DPR?', 'Banks, financial institutions and government schemes, for project loans and subsidies.'],
    ],
    m: ['Projections that the market study does not support'],
    b: [['Decision-ready', 'A full picture to decide whether the project is worth doing.']],
  },
};
