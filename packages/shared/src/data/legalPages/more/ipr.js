// More questions, common mistakes and benefits for the Trademark, Copyright and Patent pages (added to their sections).
const DISPUTE = {
  f: [
    [
      'What is the first step?',
      'Usually a cease and desist notice, after we review your rights and the evidence of copying.',
    ],
    [
      'Can I get the copying stopped quickly?',
      'A court can grant an interim injunction in suitable cases; whether to ask for one depends on your evidence and urgency.',
    ],
  ],
  m: ['Not keeping dated screenshots, invoices and samples of the copying'],
  b: [
    ['Protect your market', 'Stopping copies early keeps customers from being confused.'],
    ['Know your options', 'A notice, a settlement or a case, chosen on the strength of your rights.'],
  ],
};

export const MORE_IPR = {
  'trademark-search': {
    f: [
      [
        'What does the report show?',
        'Registered and pending marks that are the same or similar to yours in your classes, with our view on the risk.',
      ],
      [
        'Do you search company names too?',
        'Yes, we look at company and LLP names on MCA, which can also block a brand.',
      ],
    ],
    m: ['Searching only one class when you sell in several'],
    b: [['Save filing fees', 'You file only the marks with a fair chance of registration.']],
  },
  'tm-objection': {
    f: [
      [
        'How long do I have to reply?',
        'Usually 30 days from the examination report. We file before the date on your report.',
      ],
      [
        'What are common objections?',
        'A mark that describes the goods (section 9) or one similar to an earlier mark (section 11).',
      ],
    ],
    m: ['Replying without evidence of how you have used the mark'],
    b: [['A stronger application', 'A reasoned reply with proof of use moves the mark towards acceptance.']],
  },
  'tm-renewal': {
    f: [
      [
        'Can I renew after the expiry date?',
        'Yes, within six months after expiry with a surcharge, and in some cases restoration within a year after that.',
      ],
      ['Does renewal change the mark?', 'No. It keeps the same mark and classes for another ten years.'],
    ],
    m: ['Assuming the registry will remind you in time'],
    b: [['Continuous protection', 'Your rights carry on without a gap a copier could use.']],
  },
  'tm-assignment': {
    f: [
      [
        'Does assignment need a written deed?',
        'Yes. The assignment deed, on stamp paper, is filed with Form TM-P to record the new owner.',
      ],
      [
        'Can I assign only some goods or services?',
        'Yes, a partial assignment is possible, as long as it does not confuse buyers.',
      ],
    ],
    m: ['Assigning the mark without the goodwill when the deed meant to include it'],
    b: [['Ready for a sale or funding', 'The brand sits in the right company before a deal.']],
  },
  'tm-watch': {
    f: [
      ['How often do you check?', 'Every Trade Marks Journal published while the watch runs, as the package says.'],
      [
        'What happens when you find a similar mark?',
        'We tell you with our view on the risk, so you can decide whether to oppose within the four-month window.',
      ],
    ],
    m: ['Watching only the exact spelling of the brand'],
    b: [['Low cost early warning', 'Opposing a mark is cheaper than fighting it after registration.']],
  },
  'well-known-tm': {
    f: [
      [
        'What evidence is needed?',
        'Proof of long and wide use, sales and advertising figures, media coverage, registrations and orders that protected the mark.',
      ],
      [
        'How long does it take?',
        'The registry reviews the evidence and may invite objections, so it usually takes several months.',
      ],
    ],
    m: ['Filing with numbers that cannot be backed by documents'],
    b: [['Protection across classes', 'A well-known mark is protected even for goods you do not sell.']],
  },
  'copyright-registration': {
    f: [
      [
        'What can be registered?',
        'Literary works including software, artistic works such as logos, music, sound recordings and films.',
      ],
      ['How long does copyright last?', 'For most works, the author’s lifetime plus 60 years.'],
    ],
    m: ['Registering a logo only as copyright when it also needs trademark protection'],
    b: [['Easier to enforce', 'The certificate is strong evidence of ownership in a dispute.']],
  },
  'patent-search': {
    f: [
      [
        'What does the search cover?',
        'Patents and published applications in India and abroad, and other published material close to your invention.',
      ],
      [
        'Does a search tell me if I can sell my product?',
        'Not fully. A freedom-to-operate review is a separate, wider check of others’ live patents.',
      ],
    ],
    m: ['Describing the invention too briefly for a useful search'],
    b: [['Sharper claims', 'Knowing what exists helps write claims that stand out.']],
  },
  'provisional-patent': {
    f: [
      [
        'What goes into a provisional?',
        'A description of the invention clear enough to show what it is, with drawings where they help. Claims are not needed yet.',
      ],
      [
        'Can I talk about my invention after filing?',
        'Yes. The filing date protects your priority, but keep later improvements in mind for the complete specification.',
      ],
    ],
    m: ['Leaving out key features that the complete specification later needs'],
    b: [['Time to develop', 'Twelve months to test the market before the full filing.']],
  },
  'patent-registration': {
    f: [
      ['How long does a patent last?', 'Twenty years from the filing date, with yearly renewal fees after grant.'],
      [
        'Can I file abroad later?',
        'Yes, within 12 months of the Indian filing to keep its date, or through the PCT route.',
      ],
    ],
    m: ['Not paying renewal fees after grant'],
    b: [['Licence or sell it', 'A granted patent can earn royalties or be sold.']],
  },
  'tm-infringement': DISPUTE,
  'copyright-infringement': DISPUTE,
  'patent-infringement': DISPUTE,
};
