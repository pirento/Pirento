// GST & Taxation and Accounting & Financial: the pages of the services not in featured.js.
import {NOT_INCLUDED, costs, pair, qa, step} from './common.js';

const noticeDocs = [
  'The notice or order, in full',
  'Your PAN, and GSTIN where it is a GST matter',
  'Returns and documents for the period the notice is about',
  'Any reply already sent',
];

export const TAX = {
  'gst-cancellation': {
    page: {
      intro:
        'If you close the business, or no longer need to be registered, you can ask to cancel your GST registration. After cancellation a final return is still due.\nWe file the cancellation and tell you what remains.',
      whoFor: [
        'Businesses that have closed',
        'Businesses below the limit that no longer want GST',
        'A change of business structure',
      ],
      included: [
        'Cancellation application on the GST portal',
        'Replies to officer queries',
        'A note of the final return',
      ],
      notIncluded: [
        'The final return (GSTR-10), unless the package lists it',
        'Pending returns and tax for earlier periods',
      ],
      documents: [
        'GST login details or access',
        'The reason and date for cancelling',
        'Details of stock and tax paid on it on that date',
      ],
      steps: [
        step('Check', 'We see that returns up to now are filed.'),
        step('Apply', 'We file the cancellation application.'),
        step('Order', 'The officer passes a cancellation order.'),
        step('Final return', 'A final return is filed within three months of the order.'),
      ],
      timeline: ['Pending returns, which must be filed first', 'Officer queries'],
      costs: costs(),
      deliverables: ['The cancellation order', 'A list of anything still due'],
      mistakes: ['Not filing the final return after cancellation', 'Cancelling while returns are pending'],
      benefits: [pair('No more filings', 'Stops monthly returns and late fees once cancelled.')],
      faqs: [
        qa(
          'Do I need to file anything after cancelling?',
          'Yes, a final return (GSTR-10) within three months of the order.',
        ),
      ],
    },
  },

  'gst-revocation': {
    page: {
      intro:
        'If the GST officer cancelled your registration, for example for not filing returns, you can apply to revoke the cancellation within the time allowed, after filing the pending returns.\nWe prepare and file the revocation for you.',
      whoFor: ['Businesses whose GST registration was cancelled by the officer'],
      included: ['Review of the cancellation order', 'Revocation application', 'Replies to officer queries'],
      notIncluded: ['Pending returns, tax, interest and late fees, unless the package lists them', 'Appeals'],
      documents: [
        'The cancellation order',
        'GST login details or access',
        'Sales and purchase details for the pending periods',
      ],
      steps: [
        step('Review', 'We read the order and list what is pending.'),
        step('Clear dues', 'Pending returns are filed and dues paid.'),
        step('Apply', 'We file the revocation application.'),
        step('Decision', 'The officer restores the registration or asks more.'),
      ],
      timeline: ['How many returns are pending', 'Officer review and any hearing'],
      costs: costs({extra: [pair('Tax and late fees', 'Paid by you to the government for the pending periods.')]}),
      deliverables: ['The revocation order, once passed'],
      mistakes: ['Applying after the time limit', 'Applying before filing the pending returns'],
      benefits: [pair('Keep your GSTIN', 'Continue trading and claiming credit under the same number.')],
      faqs: [
        qa('Is there a time limit?', 'Yes, counted from the cancellation order, usually 90 days. We check your dates.'),
      ],
    },
  },

  'hsn-code-finder': {
    page: {
      intro:
        'HSN codes (and SAC codes for services) classify what you sell for GST. The right code decides the tax rate and must be shown on your invoices.\nWe give you a written classification for your products or services.',
      whoFor: [
        'New GST-registered businesses',
        'Businesses unsure of the rate on a product',
        'E-commerce sellers listing products',
      ],
      included: [
        'Classification of your items with their HSN or SAC code',
        'The GST rate for each, as it stands',
        'A short reason for each',
      ],
      notIncluded: ['Advance ruling applications', 'Fixing invoices already issued'],
      documents: ['A list of your products or services, with descriptions', 'Photos or specifications where it helps'],
      steps: [
        step('Share the list', 'Send what you sell.'),
        step('Classify', 'We match each item to its code.'),
        step('Report', 'You receive the codes, rates and reasons.'),
      ],
      timeline: ['The number of items', 'How clear the descriptions are'],
      costs: costs(),
      deliverables: ['A written classification report'],
      mistakes: ['Guessing a code from a similar product', 'Using too few digits for your turnover'],
      benefits: [pair('Charge the right tax', 'Avoid short payment or overcharging customers.')],
      faqs: [
        qa(
          'How many digits do I show on invoices?',
          'It depends on turnover: generally 4 digits up to ₹5 crore and 6 digits above. We confirm yours.',
        ),
      ],
    },
  },

  accounting: {
    page: {
      intro:
        'Accounting keeps your books up to date: every sale, purchase and payment recorded, bank accounts reconciled, and reports you can read. Good books make tax filings and audits straightforward.\nWe keep your books every month.',
      whoFor: ['Small businesses without an accountant', 'Startups', 'Businesses preparing for an audit or investment'],
      included: [
        'Recording of sales, purchases and expenses',
        'Bank reconciliation',
        'Monthly profit and loss and balance sheet',
      ],
      notIncluded: ['GST, TDS and income tax returns, unless the package lists them', 'Statutory audit'],
      documents: ['Sales and purchase invoices', 'Bank statements', 'Expense bills and payroll details'],
      steps: [
        step('Set up', 'We agree the software and the chart of accounts.'),
        step('Share each month', 'You upload invoices and statements.'),
        step('We record', 'We post entries and reconcile the bank.'),
        step('Reports', 'You receive the month’s reports.'),
      ],
      timeline: ['How quickly documents reach us each month', 'Backlog from earlier months'],
      costs: costs({extra: [pair('Software', 'Any paid accounting software is your own subscription.')]}),
      deliverables: ['Monthly books', 'Profit and loss and balance sheet'],
      mistakes: ['Sending bills months late', 'Paying business expenses from personal accounts'],
      benefits: [
        pair('Know your numbers', 'See profit and cash every month.'),
        pair('Ready for filings', 'Returns and audits go faster.'),
      ],
      faqs: [
        qa(
          'Which software do you use?',
          'We work with common accounting software; we agree one with you at the start.',
        ),
      ],
    },
  },

  'tds-filing': {
    page: {
      intro:
        'If you deduct tax at source (TDS) from salaries, rent, contractor or professional payments, you file quarterly TDS returns and issue TDS certificates. Late filing attracts a fee.\nWe prepare and file your returns each quarter.',
      whoFor: ['Employers', 'Businesses paying rent, contractors or professionals', 'Anyone holding a TAN'],
      included: ['Quarterly TDS return (24Q, 26Q or 27Q as needed)', 'Form 16 or 16A for the payees'],
      notIncluded: ['Paying the TDS itself', 'Correction of earlier returns, unless the package lists it'],
      documents: ['TAN', 'Details of payments and TDS deducted', 'Challans of TDS paid', 'PAN of each payee'],
      steps: [
        step('Share the quarter’s data', 'Payments, deductions and challans.'),
        step('We prepare', 'We check PANs and challans and prepare the return.'),
        step('File', 'We file and share the acknowledgement.'),
        step('Certificates', 'TDS certificates are issued to the payees.'),
      ],
      timeline: ['Wrong PANs or unmatched challans', 'The quarterly due dates'],
      costs: costs(),
      deliverables: ['Filed TDS return', 'TDS certificates (Form 16/16A)'],
      mistakes: ['Wrong PAN of a payee', 'Paying TDS under the wrong section or quarter'],
      benefits: [pair('No late fees', 'Filed before the due date.')],
      faqs: [
        qa('When are TDS returns due?', 'Quarterly: 31 July, 31 October, 31 January and 31 May for the four quarters.'),
      ],
    },
  },

  'proprietorship-tax': {
    page: {
      intro:
        'A sole proprietor files income tax as an individual, reporting the business income in their own return. Small businesses may choose presumptive taxation, which needs simpler books.\nWe prepare and file your return.',
      whoFor: ['Sole proprietors', 'Freelancers and professionals'],
      included: [
        'Income tax return for the owner with business income',
        'Check of presumptive taxation where it may apply',
      ],
      notIncluded: ['Tax audit, where your turnover needs one', 'Bookkeeping for the year'],
      documents: ['PAN and Aadhaar', 'Bank statements', 'Sales and expense details or books', 'AIS and Form 26AS'],
      steps: [
        step('Share documents', 'Books or a summary of income and expenses.'),
        step('Prepare', 'We work out the income and tax.'),
        step('Approve', 'You see the return before filing.'),
        step('File', 'We file and help you e-verify.'),
      ],
      timeline: ['How complete the books are', 'Mismatches with AIS'],
      costs: costs(),
      deliverables: ['Filed income tax return', 'Computation of income'],
      mistakes: ['Leaving out income shown in AIS', 'Claiming personal expenses as business expenses'],
      benefits: [pair('Proof of income', 'Returns are asked for loans and tenders.')],
      faqs: [qa('Which ITR form?', 'Usually ITR-3, or ITR-4 under presumptive taxation. We pick the right one.')],
    },
  },

  'llp-tax': {
    page: {
      intro:
        'An LLP files its own income tax return every year, separate from its MCA filings. If its accounts must be audited, the return is due later.\nWe prepare and file the LLP’s return.',
      whoFor: ['Every LLP'],
      included: ['Income tax return of the LLP (ITR-5)', 'Computation of income'],
      notIncluded: ['Tax audit, where needed', 'MCA annual filings (see LLP Filing)'],
      documents: [
        'LLP PAN',
        'Financial statements',
        'Bank statements',
        'Details of partners’ remuneration and interest',
      ],
      steps: [
        step('Share accounts', 'Final accounts for the year.'),
        step('Prepare', 'We compute the income and tax.'),
        step('Approve', 'Partners review the return.'),
        step('File', 'We file with a partner’s digital signature.'),
      ],
      timeline: ['Accounts being final', 'Whether a tax audit is needed'],
      costs: costs(),
      deliverables: ['Filed ITR-5', 'Computation of income'],
      mistakes: ['Partners’ remuneration above what the law allows as a deduction', 'Missing the due date'],
      benefits: [pair('Stay compliant', 'Avoid late fees and interest.')],
      faqs: [qa('When is it due?', 'Generally 31 July, or 31 October if the accounts are audited.')],
    },
  },

  'corporate-tax': {
    page: {
      intro:
        'Every company files an income tax return each year, whatever its income. Companies can choose between tax regimes where they qualify.\nWe prepare and file your company’s return.',
      whoFor: ['Private limited companies', 'OPCs and other companies'],
      included: [
        'Income tax return of the company (ITR-6)',
        'Computation of income',
        'Check of the tax regime where it may apply',
      ],
      notIncluded: ['Statutory audit and tax audit', 'Advance tax planning through the year, unless listed'],
      documents: [
        'Company PAN',
        'Audited financial statements',
        'TDS and tax payment details',
        'Tax audit report, where needed',
      ],
      steps: [
        step('Share accounts', 'Audited accounts for the year.'),
        step('Prepare', 'We compute income and tax.'),
        step('Approve', 'Directors review the return.'),
        step('File', 'We file with a director’s digital signature.'),
      ],
      timeline: ['The audit being complete', 'Mismatches with Form 26AS'],
      costs: costs(),
      deliverables: ['Filed ITR-6', 'Computation of income'],
      mistakes: ['Filing before the audit is signed', 'Missing advance tax instalments'],
      benefits: [pair('Clean record', 'Needed for loans, tenders and investment.')],
      faqs: [
        qa(
          'Does a loss-making company file?',
          'Yes, every company files, and filing on time lets losses be carried forward.',
        ),
      ],
    },
  },

  'tax-assessment': {
    page: {
      intro:
        'In a scrutiny assessment, the income tax department examines your return in detail and asks for explanations and evidence, usually online through faceless assessment.\nThis starts with a paid consultation; after reviewing your case we quote the full work.',
      whoFor: ['Anyone whose return is selected for scrutiny', 'Taxpayers asked for details on their return'],
      included: ['A consultation to review the notice and your position', 'A quote for handling the assessment'],
      notIncluded: ['Appeals', 'Tax, interest or penalty demanded'],
      documents: noticeDocs,
      steps: [
        step('Consultation', 'We review the notice and documents with you.'),
        step('Quote', 'We quote the work for your case.'),
        step('Replies', 'We prepare and file replies with evidence.'),
        step('Order', 'The department passes the assessment order.'),
      ],
      timeline: ['The dates in each notice', 'How quickly evidence can be gathered'],
      costs: costs({extra: [pair('Full work', 'Quoted after the consultation.')]}),
      deliverables: ['Replies filed for you', 'A note on the order once passed'],
      mistakes: ['Missing a reply date', 'Replying without supporting documents'],
      benefits: [pair('Prepared replies', 'Clear answers backed by evidence.')],
      faqs: [qa('Can you promise the result?', 'No. We prepare the best reply on the facts; the officer decides.')],
    },
  },

  'tax-notice': {
    page: {
      intro:
        'An income tax notice may be an intimation, a request to fix a defect, a question about income or a reassessment. Each has its own deadline and response.\nWe read your notice, explain it, and file the right response.',
      whoFor: ['Anyone who received an income tax notice or intimation'],
      included: ['Reading and explaining the notice', 'Preparing and filing the response online'],
      notIncluded: ['Scrutiny assessments (see Tax Assessment)', 'Appeals', 'Tax or penalty demanded'],
      documents: noticeDocs,
      steps: [
        step('Share the notice', 'Upload it with your return.'),
        step('Explain', 'We tell you what it means and the deadline.'),
        step('Respond', 'We prepare the response with you.'),
        step('File', 'We file it on the e-filing portal.'),
      ],
      timeline: ['The deadline in the notice', 'Documents still to collect'],
      costs: costs(),
      deliverables: ['The response filed', 'Its acknowledgement'],
      mistakes: ['Ignoring an intimation', 'Replying after the deadline'],
      benefits: [pair('Peace of mind', 'Know what the notice means and what to do.')],
      faqs: [qa('Is every notice serious?', 'No. Many are routine; we tell you which kind yours is.')],
    },
  },

  'reply-to-notice': {
    page: {
      intro:
        'When a tax authority asks for an explanation, a clear written reply with evidence matters. We draft replies to income tax and GST notices and file them for you.',
      whoFor: ['Businesses and individuals who received an income tax or GST notice'],
      included: ['A drafted reply with the supporting documents listed', 'Filing on the portal'],
      notIncluded: ['Personal hearings and appeals, unless listed', 'Tax or penalty demanded'],
      documents: noticeDocs,
      steps: [
        step('Review', 'We read the notice and your records.'),
        step('Draft', 'We draft the reply.'),
        step('Approve', 'You check it before it is sent.'),
        step('File', 'We file it and share the acknowledgement.'),
      ],
      timeline: ['The deadline in the notice', 'Collecting evidence'],
      costs: costs(),
      deliverables: ['The filed reply', 'Its acknowledgement'],
      mistakes: ['Admitting facts that are not correct', 'Missing documents the reply relies on'],
      benefits: [pair('A clear answer', 'Facts and evidence set out plainly.')],
      faqs: [
        qa('What if a hearing is fixed?', 'We can represent you; it is quoted separately unless the package lists it.'),
      ],
    },
  },

  'virtual-cfo': {
    page: {
      intro:
        'A virtual CFO gives a growing business senior finance support without a full-time hire: budgets, cash-flow planning, monthly reports and help with investors and banks.\nThis starts with a paid consultation; we then agree the monthly scope and fee.',
      whoFor: ['Startups preparing to raise money', 'Growing businesses without a finance head'],
      included: ['A consultation on your needs', 'A quote for a monthly retainer'],
      notIncluded: ['Bookkeeping and filings, unless agreed in the retainer'],
      documents: ['Recent financial statements', 'Bank statements', 'Your business plan or budget, if any'],
      steps: [
        step('Consultation', 'We understand your business and goals.'),
        step('Scope', 'We agree the monthly work and fee.'),
        step('Monthly work', 'Budgets, reports and reviews each month.'),
      ],
      timeline: ['The scope agreed'],
      costs: costs({extra: [pair('Monthly retainer', 'Agreed after the consultation.')]}),
      deliverables: ['Monthly management reports', 'Budgets and cash-flow plans as agreed'],
      mistakes: ['Starting without clean books'],
      benefits: [
        pair('Better decisions', 'Numbers you can plan with.'),
        pair('Investor-ready', 'Reports investors expect.'),
      ],
      faqs: [qa('Is it a full-time CFO?', 'No. It is part-time senior support on an agreed scope.')],
    },
  },
};
