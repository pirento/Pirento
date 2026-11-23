// More questions, common mistakes and benefits for the Tax pages (added to their sections).
export const MORE_TAX = {
  'gst-cancellation': {
    f: [
      [
        'When can I apply to cancel GST?',
        'When the business closes, is transferred, or no longer needs registration, for example when turnover stays below the limit and you registered voluntarily.',
      ],
      [
        'Do I pay tax on stock left at closing?',
        'Input tax credit taken on stock and capital goods on hand may have to be paid back in the final return. We work out the amount with you.',
      ],
    ],
    m: ['Applying while invoices are still being raised under the GSTIN'],
    b: [['A clean closure', 'No notices for returns that were never filed after you stopped trading.']],
  },
  'gst-revocation': {
    f: [
      [
        'What happens after revocation?',
        'The GSTIN becomes active again from the date it was cancelled, and you carry on filing returns as before.',
      ],
      [
        'What if revocation is refused?',
        'The order can be appealed within the time the law allows; we tell you whether that suits your case.',
      ],
    ],
    m: ['Applying without paying the tax, interest and late fees shown in the pending returns'],
    b: [['Trade without a break', 'Buyers can claim credit on your invoices again once the GSTIN is active.']],
  },
  'hsn-code-finder': {
    f: [
      [
        'What is the difference between HSN and SAC?',
        'HSN codes classify goods; SAC codes classify services. Both are used on GST invoices and in returns.',
      ],
      [
        'Can one product have two possible codes?',
        'Sometimes. We read the tariff headings and notes for your product and explain which code fits and why.',
      ],
    ],
    m: ['Applying the rate of a similar product without checking the exact heading'],
    b: [['Fewer disputes', 'A code backed by the tariff text is easier to defend if it is questioned.']],
  },
  accounting: {
    f: [
      [
        'How often will you update my books?',
        'As often as the package says, usually every month, from the bills and statements you share.',
      ],
      ['Do I get reports?', 'Yes: profit and loss, balance sheet and the ledgers your CA or lender needs.'],
    ],
    m: ['Not reconciling the bank account with the books every month'],
    b: [['Faster year-end', 'Tax returns and audits move quicker when the books are already in order.']],
  },
  'tds-filing': {
    f: [
      [
        'What is Form 16 or 16A?',
        'The TDS certificates you give to employees (Form 16) and other payees (Form 16A), downloaded after the return is processed.',
      ],
      ['What if I filed a wrong return?', 'A correction statement can be filed to fix PAN, amount or challan details.'],
    ],
    m: ['Deducting TDS but not depositing it on time'],
    b: [['Payees get credit', 'Your vendors and staff see the tax in their Form 26AS and can claim it.']],
  },
  'proprietorship-tax': {
    f: [
      [
        'Can I use presumptive taxation?',
        'Small businesses and professionals within the limits can declare income at a set rate of turnover under sections 44AD or 44ADA, with fewer books to keep.',
      ],
      [
        'Do I need a tax audit?',
        'Only when turnover or the income you declare crosses the limits in the Income Tax Act. We check this from your figures.',
      ],
    ],
    m: ['Missing advance tax instalments when the tax due is above the limit'],
    b: [['Easier loans', 'Filed returns are the income proof banks ask for.']],
  },
  'llp-tax': {
    f: [
      [
        'What rate does an LLP pay?',
        'An LLP is taxed at a flat rate on its profit, plus surcharge and cess where they apply, and files ITR-5.',
      ],
      [
        'Does an LLP need a tax audit?',
        'When its turnover crosses the limit in the Income Tax Act; otherwise its return is due by the July date.',
      ],
    ],
    m: ['Mixing partners’ personal expenses with the LLP’s'],
    b: [['Losses carried forward', 'A return filed on time lets business losses be set off in later years.']],
  },
  'corporate-tax': {
    f: [
      [
        'Which rate applies to my company?',
        'Companies can choose between the normal rates and the lower concessional rates under sections 115BAA or 115BAB, which drop some deductions. We compare both for you.',
      ],
      [
        'Is a transfer pricing report needed?',
        'Only for companies with international or specified domestic transactions with related parties above the limits.',
      ],
    ],
    m: ['Not choosing the concessional rate in time when it would cost less'],
    b: [['Fewer notices', 'Returns that match the audited accounts and Form 26AS draw fewer questions.']],
  },
  'tax-assessment': {
    f: [
      [
        'What is a faceless assessment?',
        'Most income tax assessments now happen online through the e-filing portal, without meeting the officer; replies and documents are uploaded there.',
      ],
      [
        'Can I appeal the order?',
        'Yes. An appeal can usually be filed before the Commissioner (Appeals) within the time the law allows after the order.',
      ],
    ],
    m: ['Giving different figures in different replies'],
    b: [['A record that holds up', 'Clear, documented replies are what an appeal relies on later.']],
  },
  'tax-notice': {
    f: [
      [
        'How do I know a notice is genuine?',
        'Income tax notices carry a document identification number (DIN) you can check on the e-filing portal. We check it for you.',
      ],
      ['Do you handle GST notices too?', 'Yes. Tell us which law the notice is under when you order.'],
    ],
    m: ['Paying a demand without checking whether it is correct'],
    b: [['Know what is asked', 'We explain the notice in plain words and what it needs from you.']],
  },
  'reply-to-notice': {
    f: [
      [
        'Can I ask for more time?',
        'Often yes, through the portal, with a reason. Whether it is granted is up to the officer.',
      ],
      [
        'Will you file the reply for me?',
        'Yes, on the portal where the notice came, with your approval of the final text.',
      ],
    ],
    m: ['Sending a short reply without the documents asked for'],
    b: [['Less back and forth', 'A complete first reply often closes the matter faster.']],
  },
  'virtual-cfo': {
    f: [
      [
        'What does a month include?',
        'Reviewing your books, cash flow and budget, monthly reports, and a call to plan the next steps, as the package lists.',
      ],
      ['Can you talk to our investors or bank?', 'Yes, we can join calls and prepare the numbers they ask for.'],
    ],
    m: ['Looking at profit only, not cash in the bank'],
    b: [['Senior help at part-time cost', 'Finance experience without a full-time salary.']],
  },
};
