// More questions, common mistakes and benefits for the Compliance and company-change pages (added to their sections).
const BOARD = 'Passing the board or members’ resolution after the date it is meant to take effect';
const RECORDS = [
  'Every register in step',
  'Your statutory registers and the MCA records show the same thing, which banks and investors check.',
];

export const MORE_COMPLIANCE = {
  'annual-compliance': {
    f: [
      [
        'Which forms are filed every year?',
        'For most private companies: the financial statements (AOC-4), the annual return (MGT-7 or MGT-7A), the director KYC and the auditor’s appointment when it is due.',
      ],
    ],
    m: ['Signing the accounts without board approval recorded in minutes'],
    b: [['A company you can sell or fund', 'Clean filings make due diligence quicker.']],
  },
  'llp-filing': {
    f: [
      [
        'Which forms are filed every year?',
        'Form 11, the annual return, and Form 8, the statement of account and solvency, plus the partners’ KYC.',
      ],
      ['Does an LLP with no business still file?', 'Yes. Filings are due every year whether or not the LLP traded.'],
    ],
    m: ['Not updating the LLP agreement when partners or contributions change'],
    b: [
      ['No daily late fees', 'Filing on time avoids the per-day additional fee.'],
      ['Easy to close later', 'An LLP with up-to-date filings can be closed simply.'],
    ],
  },
  'secretarial-audit': {
    f: [
      ['Who carries it out?', 'A practising company secretary, who gives the report in Form MR-3.'],
      [
        'What does it look at?',
        'Board and general meetings, registers, filings and compliance with company and other laws that apply.',
      ],
    ],
    m: ['Appointing the auditor late in the year'],
    b: [['Board confidence', 'Directors see how the company is doing on compliance each year.']],
  },
  'compliance-check': {
    f: [
      [
        'What do I get?',
        'A report listing what is in order, what is missing and what to do first, with the cost to fix each.',
      ],
      [
        'Which laws do you check?',
        'Company or LLP law, GST, income tax and the labour registrations that apply to your size, as the package lists.',
      ],
    ],
    m: ['Fixing the visible issues and leaving the registers and minutes for later'],
    b: [['Ready for funding', 'Gaps are closed before an investor’s lawyers find them.']],
  },
  'due-diligence': {
    f: [
      [
        'How long does it take?',
        'It depends on the size of the company and how fast documents come; we agree a timeline after seeing the data room.',
      ],
      ['Is the report confidential?', 'Yes. It is shared only with you and the people you name.'],
    ],
    m: ['Relying on the seller’s summary without seeing the documents'],
    b: [
      ['Better terms', 'Issues found early can be priced in or fixed before signing.'],
      ['Fewer surprises', 'You know the liabilities you take on.'],
    ],
  },
  'rbi-compliance': {
    f: [
      [
        'Which reports are due after foreign investment?',
        'Usually Form FC-GPR within 30 days of issuing shares to a foreign investor, and the annual FLA return by its July date.',
      ],
      [
        'What if a report was missed?',
        'It can often be filed late with a late submission fee or compounded; we tell you which route fits.',
      ],
    ],
    m: ['Receiving foreign money without the bank’s documents for the inward remittance'],
    b: [['Smooth future rounds', 'Investors ask for clean RBI filings before they invest.']],
  },
  'add-director': {
    f: [
      [
        'Which form is filed?',
        'Form DIR-12 with the Registrar, with the director’s consent (DIR-2) and the resolution appointing them.',
      ],
      [
        'Can a foreign national be a director?',
        'Yes, with a DIN and the documents notarised or apostilled as the rules need. At least one director must have stayed in India for 182 days in the year.',
      ],
    ],
    m: [BOARD],
    b: [RECORDS],
  },
  'remove-director': {
    f: [
      [
        'What if a director resigns?',
        'The director sends a resignation letter, the company files DIR-12 within 30 days, and the director may file DIR-11.',
      ],
      ['Does the director lose their DIN?', 'No. The DIN stays with the person; only their link to this company ends.'],
    ],
    m: [],
    b: [RECORDS],
  },
  'increase-capital': {
    f: [
      [
        'What is the difference between authorised and paid-up capital?',
        'Authorised capital is the most the company can issue under its MOA; paid-up capital is what has been issued and paid for.',
      ],
      [
        'Is stamp duty payable?',
        'Yes, on the increase in authorised capital, at the rate your state sets; it is paid through the MCA filing.',
      ],
    ],
    m: [BOARD],
    b: [RECORDS],
  },
  'change-name': {
    f: [
      [
        'Does the company’s PAN or CIN change?',
        'The PAN stays the same; the CIN keeps the company’s registration number, and a fresh incorporation certificate is issued in the new name.',
      ],
      [
        'How long is a name reserved?',
        'An approved name is kept for a limited time, so the change has to be filed soon after.',
      ],
    ],
    m: ['Not updating the bank, GST and letterheads after the change'],
    b: [RECORDS],
  },
  'change-address': {
    f: [
      [
        'Within the same city, is it simple?',
        'Yes. A board resolution and Form INC-22 within 30 days are usually enough.',
      ],
      [
        'What proof of the new office is needed?',
        'A utility bill and the owner’s NOC or the rent agreement, as for incorporation.',
      ],
    ],
    m: [BOARD],
    b: [RECORDS],
  },
  'change-objective': {
    f: [
      ['Which form is filed?', 'Form MGT-14, with the special resolution and the altered MOA.'],
      [
        'Can a company do business outside its objects?',
        'It should not. The objects clause sets what the company may do, so change it before starting a new line of business.',
      ],
    ],
    m: [BOARD],
    b: [RECORDS],
  },
  'close-company': {
    f: [
      [
        'Can a company with debts be closed by strike off?',
        'No. Strike off suits companies with no assets or liabilities; a company with debts goes through winding up or settles them first.',
      ],
      [
        'What happens to the bank account?',
        'It is closed before applying, and the closing statement goes with the application.',
      ],
    ],
    m: ['Not keeping the company’s records after closure'],
    b: [['Directors protected', 'Closing properly avoids directors being disqualified for missed filings.']],
  },
  'strike-off': {
    f: [
      ['Which form is filed?', 'Form STK-2, with the directors’ indemnity and affidavit and a statement of accounts.'],
      [
        'How long does it take?',
        'The Registrar publishes a notice and waits for objections, so it usually takes a few months.',
      ],
    ],
    m: ['Directors signing the affidavit without checking for liabilities'],
    b: [['Low cost', 'The simplest way to close a company that never started or has stopped.']],
  },
  'close-llp': {
    f: [
      [
        'Which form is filed?',
        'Form 24, with the partners’ affidavits and a statement of accounts showing no assets or liabilities.',
      ],
      ['Can an LLP with liabilities be closed this way?', 'No. It must settle them first or go through winding up.'],
    ],
    m: ['Leaving the bank account open when applying'],
    b: [['A clear end', 'Partners stop being responsible for yearly filings.']],
  },
  'add-partner': {
    f: [
      [
        'Which form is filed?',
        'Form 4 for the new partner, and Form 3 for the changed LLP agreement, each within 30 days.',
      ],
      ['Does the new partner need a DPIN?', 'A designated partner needs a DIN; other partners do not.'],
    ],
    m: ['Adding the partner without agreeing their contribution and profit share in writing'],
    b: [RECORDS],
  },
  'change-llp-agreement': {
    f: [
      ['Which form is filed?', 'Form 3, within 30 days of the change, with the supplementary agreement.'],
      ['What usually changes?', 'Partners, contributions, profit shares, or the rules for decisions and exits.'],
    ],
    m: ['Changing profit shares in practice without changing the agreement'],
    b: [RECORDS],
  },
};
