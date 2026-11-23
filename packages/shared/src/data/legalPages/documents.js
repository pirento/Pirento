// Legal Notices and Legal Documents: the pages of these services.
import {costs, pair, qa, step} from './common.js';

// A notice drafted and sent by a lawyer: the same flow, with the facts and law of each kind.
function notice({intro, whoFor, documents, faqs, mistakes, timeline}) {
  return {
    page: {
      intro,
      whoFor,
      included: [
        'A notice drafted by a lawyer from your facts',
        'Sending it by registered post or courier, and email where useful',
        'A copy and proof of sending for your records',
      ],
      notIncluded: ['Filing a case if the notice is not answered, which is quoted separately', 'Court fees'],
      documents: [...documents, 'Name and address of the other side'],
      steps: [
        step('Share the facts', 'What happened, with documents.'),
        step('Draft', 'A lawyer drafts the notice.'),
        step('Approve', 'You check it before it goes.'),
        step('Send', 'We send it and share proof of sending.'),
      ],
      timeline: timeline ?? ['How quickly you approve the draft'],
      costs: costs(),
      deliverables: ['The signed notice', 'Proof of sending'],
      mistakes: mistakes ?? ['Overstating facts you cannot prove', 'Sending without keeping proof of delivery'],
      benefits: [pair('Taken seriously', 'A lawyer’s notice often settles a matter without court.')],
      faqs,
    },
  };
}

// A document drafted or reviewed by a lawyer.
function doc({intro, whoFor, kinds, documents, faqs}) {
  return {
    page: {
      intro,
      whoFor,
      included: [
        'Drafting or review by a lawyer',
        'One round of changes after your comments',
        'A final copy ready to sign',
      ],
      notIncluded: ['Stamp duty and notary charges', 'Negotiating with the other side, unless the package lists it'],
      documents: [...documents, 'Any earlier draft or document you have'],
      steps: [
        step('Brief', 'Tell us what you need and the key terms.'),
        step('Draft', 'A lawyer drafts or reviews it.'),
        step('Revise', 'You comment; we revise once.'),
        step('Final', 'You receive the final document.'),
      ],
      timeline: ['How quickly the terms are agreed'],
      costs: costs({
        extra: [pair('Stamp duty', 'Set by your state and paid when the document is printed and signed.')],
      }),
      deliverables: ['Final document in Word and PDF'],
      mistakes: ['Using a template that does not fit your deal', 'Leaving out how disputes are settled'],
      benefits: [pair('Fits your deal', 'Written for your facts, not a template.')],
      faqs: [qa('What kinds can you draft?', kinds), ...faqs],
    },
  };
}

export const DOCUMENTS = {
  'legal-notice': notice({
    intro:
      'A legal notice tells the other side formally what you claim and what you want them to do, often before going to court. Many disputes settle at this stage.\nA lawyer drafts and sends the notice for you.',
    whoFor: ['Anyone with a dispute over money, property, a contract or service'],
    documents: ['Agreements, invoices, messages or other proof'],
    faqs: [
      qa(
        'Is a notice compulsory before a case?',
        'Only for some cases; it is often sent anyway to try to settle first.',
      ),
    ],
  }),
  'money-recovery': notice({
    intro:
      'If someone owes you money, a lawyer’s recovery notice sets out the amount and asks for payment by a date. If it is not paid, a recovery suit or other remedies can follow.\nWe draft and send the notice.',
    whoFor: ['Businesses with unpaid invoices', 'Anyone owed money on a loan or contract'],
    documents: ['Invoices, agreements or loan proof', 'Payment history and reminders sent'],
    faqs: [
      qa(
        'What if they still do not pay?',
        'A recovery suit or, for MSME suppliers, the MSME facilitation council may be options. We advise and quote.',
      ),
    ],
  }),
  'cheque-bounce': notice({
    intro:
      'If a cheque you received bounces, Section 138 of the Negotiable Instruments Act lets you send a notice within 30 days of the bank’s return memo. The drawer then has 15 days to pay; if they do not, a complaint can be filed within the following month.\nWe draft and send the notice in time.',
    whoFor: ['Anyone holding a bounced cheque'],
    documents: ['The bounced cheque', 'The bank’s return memo', 'Proof of the debt the cheque was for'],
    timeline: ['The 30-day limit from the return memo, which cannot be missed'],
    mistakes: ['Sending the notice after 30 days', 'Wrong amount or address in the notice'],
    faqs: [qa('How soon must the notice go?', 'Within 30 days of receiving the bank’s return memo.')],
  }),
  'consumer-notice': notice({
    intro:
      'If a product is faulty or a service was poor, a notice to the seller or provider under the Consumer Protection Act, 2019 often gets a refund or fix. If not, a complaint can be filed with the consumer commission.\nWe draft and send the notice.',
    whoFor: ['Consumers with a faulty product or deficient service'],
    documents: ['Bill or invoice', 'Warranty card, if any', 'Complaints and replies so far'],
    faqs: [
      qa(
        'What comes after the notice?',
        'If it is not resolved, a complaint before the consumer commission (see Consumer Complaint).',
      ),
    ],
  }),
  'tenant-notice': notice({
    intro:
      'Landlords send a notice to a tenant for unpaid rent, to end a tenancy or to ask them to vacate, following the rent agreement and the state’s rent law. Tenants can also send one about a deposit or repairs.\nWe draft and send the notice.',
    whoFor: ['Landlords', 'Tenants with a deposit or repair dispute'],
    documents: ['Rent agreement', 'Rent receipts or payment history', 'Messages about the issue'],
    faqs: [qa('Does the notice period depend on the agreement?', 'Yes, and on your state’s rent law. We check both.')],
  }),

  agreements: doc({
    intro:
      'Agreements set out who does what, for how much, and what happens if things go wrong. A clear agreement prevents disputes.\nA lawyer drafts or reviews your agreement.',
    whoFor: ['Businesses and individuals entering a deal'],
    kinds: 'Common ones include service, partnership, shareholder, rent, sale, NDA and freelance agreements.',
    documents: ['Names and details of the parties', 'The key terms: price, timelines, duration, exit'],
    faqs: [qa('Does it need stamp paper?', 'Most agreements need stamp duty at your state’s rate.')],
  }),
  contracts: doc({
    intro:
      'Business contracts with clients, vendors and staff decide your rights when something goes wrong. A lawyer drafts new contracts or reviews ones you were sent, flagging risky clauses.',
    whoFor: ['Businesses signing with clients, vendors or employees'],
    kinds: 'Vendor, client, employment, consultancy, licensing and supply contracts.',
    documents: ['The contract you received, or the terms you want', 'Your side and the other side’s details'],
    faqs: [
      qa('Can you review a contract I was sent?', 'Yes, with comments on the risky clauses and suggested changes.'),
    ],
  }),
  drafting: doc({
    intro:
      'For any other legal document, such as letters, deeds, resolutions and undertakings, a lawyer drafts it to fit your purpose.',
    whoFor: ['Anyone who needs a legal document written properly'],
    kinds: 'Letters, deeds, undertakings, board resolutions and declarations.',
    documents: ['What the document is for', 'Names and facts it must contain'],
    faqs: [],
  }),
  policies: doc({
    intro:
      'Websites, apps and businesses need written policies: privacy, terms of use, refund, and HR policies. Privacy policies should follow the Digital Personal Data Protection Act, 2023.\nA lawyer drafts policies for your business.',
    whoFor: ['Websites and apps', 'Businesses with employees'],
    kinds: 'Privacy policy, terms of use, refund and cancellation policy, and HR policies.',
    documents: ['What your business or app does', 'What personal data you collect and why'],
    faqs: [
      qa(
        'Can I copy another site’s policy?',
        'It may not fit your data or business, and copying can breach copyright.',
      ),
    ],
  }),
  affidavits: {
    page: {
      intro:
        'An affidavit is a written statement you swear to be true, used for name changes, address proof, lost documents and many applications. It is printed on stamp paper and attested by a notary.\nWe draft it to the wording the authority expects.',
      whoFor: ['Anyone asked for an affidavit by an authority, bank or school'],
      included: ['Affidavit drafted to your purpose', 'Guidance on stamp paper and notary'],
      notIncluded: ['Stamp paper and notary charges'],
      documents: ['ID proof', 'The facts to be stated', 'The format the authority asked for, if any'],
      steps: [
        step('Purpose', 'Tell us what it is for.'),
        step('Draft', 'We draft the affidavit.'),
        step('Sign', 'It is printed on stamp paper, signed and notarised.'),
      ],
      timeline: ['Notary availability'],
      costs: costs({extra: [pair('Stamp paper and notary', 'Paid when the affidavit is printed and attested.')]}),
      deliverables: ['Affidavit ready to print and sign'],
      mistakes: ['Wrong stamp paper value', 'Facts that differ from your other documents'],
      benefits: [pair('Right the first time', 'Worded as the authority expects.')],
      faqs: [qa('Is a false affidavit an offence?', 'Yes. State only true facts.')],
    },
  },
};
