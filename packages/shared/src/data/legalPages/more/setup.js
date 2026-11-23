// More questions, common mistakes and benefits for the Business Setup and Licences pages (added to their sections).
export const MORE_SETUP = {
  'sole-proprietorship': {
    f: [
      [
        'Is there one registration for a proprietorship?',
        'No. A proprietorship is identified by the registrations it holds, such as GST, Udyam or a shop and establishment licence. We help you choose the ones your bank and customers will ask for.',
      ],
      [
        'How is a proprietorship taxed?',
        'Its profit is the owner’s income and is taxed at the owner’s slab rates in their own income tax return.',
      ],
    ],
    m: ['Opening a current account without any registration in the business name'],
    b: [['Low cost to run', 'Few filings and no separate company returns, so yearly costs stay small.']],
  },
  'partnership-firm': {
    f: [
      [
        'Is registering the firm compulsory?',
        'Registration with the Registrar of Firms is optional in most states, but an unregistered firm cannot file a case to enforce its contracts against others. Registering is usually worth it.',
      ],
      [
        'Does the partnership deed need stamp duty?',
        'Yes. The deed is printed on stamp paper of the value your state sets; we tell you the amount before it is bought.',
      ],
    ],
    m: ['Not registering the firm, which limits its right to sue'],
    b: [['Simple to change', 'Partners can be added or the deed changed with fewer formalities than a company.']],
  },
  'nidhi-company': {
    f: [
      [
        'Does a Nidhi need RBI registration?',
        'No. A Nidhi is notified by the Central Government under the Companies Act and follows the Nidhi Rules, not RBI registration as an NBFC.',
      ],
    ],
    m: ['Advertising deposit schemes to the public, which the Nidhi Rules do not allow'],
    b: [['Savings culture', 'Members save and borrow within a group they know.']],
  },
  'producer-company': {
    f: [
      [
        'How many members are needed?',
        'At least ten individual producers, or two producer institutions, or a mix of the two.',
      ],
      [
        'Can it share profits with members?',
        'Yes, through patronage bonus linked to how much each member does business with the company, as its articles allow.',
      ],
    ],
    m: ['Articles that do not match how members will actually trade with the company'],
    b: [['Access to schemes', 'Many farmer-producer schemes and loans are open to registered producer companies.']],
  },
  'startup-india-registration': {
    f: [
      [
        'Which entities can apply?',
        'A private limited company, an LLP or a registered partnership firm, within the age and turnover limits DPIIT sets.',
      ],
      [
        'Can recognition be withdrawn?',
        'Yes, if the details given turn out to be wrong or the entity stops meeting the conditions.',
      ],
    ],
    m: ['Applying without a clear write-up of what is new about the product or process'],
    b: [],
  },
  'trade-license': {
    f: [
      [
        'Is it the same as a shop and establishment registration?',
        'No. The trade licence comes from the city or local body for the trade at the premises; shop and establishment registration comes from the state labour department.',
      ],
      [
        'What if I move premises?',
        'A trade licence is tied to the premises, so a new place usually needs a new licence or an amendment.',
      ],
    ],
    m: ['Starting trade before the licence is issued'],
    b: [['Fewer questions from banks', 'Many banks and landlords ask for the trade licence when you open an account.']],
  },
  iso: {
    f: [
      [
        'Which standard should I choose?',
        'ISO 9001 covers quality management and suits most businesses; others cover areas such as information security (ISO 27001) or the environment (ISO 14001). We help you pick.',
      ],
    ],
    m: ['Writing policies the team does not actually follow, which shows up in the audit'],
    b: [
      ['Better processes', 'The preparation makes roles, records and checks clearer.'],
      ['Tender ready', 'Many tenders ask for an ISO certificate from an accredited body.'],
    ],
  },
  bis: {
    f: [
      [
        'How long does a BIS licence last?',
        'It is granted for a set period and must be renewed before it ends; we tell you the dates for your licence.',
      ],
      [
        'Can a foreign manufacturer apply?',
        'Yes, under the foreign manufacturers scheme, with an authorised Indian representative.',
      ],
    ],
    m: [],
    b: [['Buyer confidence', 'The ISI or registration mark tells buyers the product meets the Indian standard.']],
  },
  hallmark: {
    f: [
      [
        'What is HUID?',
        'A six-character hallmark unique identification number marked on each hallmarked piece, which lets buyers check it on the BIS CARE app.',
      ],
      [
        'Who registers with BIS?',
        'The jeweller registers with BIS; the hallmarking itself is done at a BIS-recognised assaying and hallmarking centre.',
      ],
    ],
    m: ['Displaying a lapsed registration in the shop'],
    b: [['Sell legally', 'Hallmarked jewellery meets the rules where hallmarking is mandatory.']],
  },
  dsc: {
    f: [
      ['Which class do I need?', 'Most government filings, such as MCA, GST and income tax, use a Class 3 DSC.'],
      [
        'Is video verification needed?',
        'Yes, the certifying authority usually asks for a short video and mobile and email checks before issuing the DSC.',
      ],
    ],
    m: ['Sharing the DSC token or its PIN with others'],
    b: [['Faster filings', 'Sign returns and forms online without printing or posting.']],
  },
};
