// Compliance and Company Changes: the pages of these services.
import {NOT_INCLUDED, costs, pair, qa, step} from './common.js';

const consult = (what) => [
  step('Consultation', `We understand your ${what} and what you need.`),
  step('Quote', 'We quote the full work for your case.'),
  step('Work', 'We do the work and keep you updated.'),
  step('Report', 'You receive the outcome in writing.'),
];

// Company changes share most of their shape: a board or members’ decision, a form with the ROC, updated records.
function change({intro, whoFor, decision, form, documents, deliverables, faqs, mistakes, timeline}) {
  return {
    page: {
      intro,
      whoFor,
      included: [
        `Drafting of the ${decision}`,
        `Filing of ${form} with the Registrar`,
        'Updated records shared with you',
      ],
      notIncluded: [NOT_INCLUDED.gov, 'Changes to other registrations (GST, bank, licences)'],
      documents: [
        'Company or LLP details and login to the MCA portal, if any',
        ...documents,
        'Digital signature of a director or designated partner',
      ],
      steps: [
        step('Tell us the change', 'What changes and from when.'),
        step('Draft', `We draft the ${decision}.`),
        step('Sign', 'Directors, partners or members sign as needed.'),
        step('File', `We file ${form} and share the acknowledgement.`),
      ],
      timeline: timeline ?? ['Getting signatures from everyone needed', 'The Registrar’s review'],
      costs: costs({gov: true}),
      deliverables,
      mistakes: mistakes ?? ['Filing after the 30-day limit, which brings additional fees'],
      benefits: [pair('Records that match', 'Your public records show the change correctly.')],
      faqs,
    },
  };
}

export const COMPLIANCE = {
  'annual-compliance': {
    page: {
      intro:
        'Every private limited company must hold board meetings and an annual general meeting, keep audited accounts, and file its financial statements and annual return with the Registrar each year. Missing them brings heavy late fees and can lead to directors being disqualified.\nWe handle the year’s ROC compliance for you.',
      whoFor: ['Private limited companies and OPCs'],
      included: [
        'Financial statements filing (AOC-4)',
        'Annual return filing (MGT-7 or MGT-7A)',
        'Auditor appointment filing (ADT-1), where due',
        'Directors’ KYC (DIR-3 KYC)',
        'Minutes and notices for the board meetings and AGM',
      ],
      notIncluded: [
        NOT_INCLUDED.gov,
        'Bookkeeping and the statutory audit itself',
        'Income tax return (see Corporate Tax)',
      ],
      documents: [
        'Audited financial statements and auditor’s report',
        'Directors’ report',
        'Shareholding details',
        'Digital signature of a director',
      ],
      steps: [
        step('Plan the year', 'We list the meetings and filings with dates.'),
        step('Meetings', 'We prepare notices and minutes.'),
        step('Filings', 'We file AOC-4, MGT-7 and the rest.'),
        step('Done', 'You receive every acknowledgement.'),
      ],
      timeline: ['The audit being finished', 'The AGM date'],
      costs: costs({gov: true}),
      deliverables: ['Filed annual forms with acknowledgements', 'Minutes and notices', 'Next year’s calendar'],
      mistakes: ['Holding the AGM late', 'Not filing because the company had no business'],
      benefits: [
        pair('Avoid late fees', 'Each day late adds a fee per form.'),
        pair('Protect directors', 'Keeps directors from disqualification.'),
      ],
      faqs: [
        qa(
          'When are the filings due?',
          'AOC-4 within 30 days of the AGM and MGT-7 within 60 days; the AGM is usually held by 30 September.',
        ),
        qa('We had no business this year. Do we still file?', 'Yes. Every company files, even with nil activity.'),
      ],
    },
  },

  'llp-filing': {
    page: {
      intro:
        'Every LLP files two forms with the Registrar each year: its annual return (Form 11) and its statement of account and solvency (Form 8). They are due even if the LLP did no business.\nWe prepare and file both.',
      whoFor: ['Every LLP'],
      included: ['Form 11 (annual return)', 'Form 8 (statement of account and solvency)'],
      notIncluded: [NOT_INCLUDED.gov, 'Accounting and audit', 'The LLP’s income tax return (see LLP Tax)'],
      documents: [
        'LLP details',
        'Financial statements for the year',
        'Partners’ contribution details',
        'Digital signature of a designated partner',
      ],
      steps: [
        step('Share details', 'Partners and accounts for the year.'),
        step('Prepare', 'We prepare Form 11 and Form 8.'),
        step('Sign', 'Designated partners sign digitally.'),
        step('File', 'We file and share the acknowledgements.'),
      ],
      timeline: ['Accounts being final', 'Partners’ signatures'],
      costs: costs({gov: true}),
      deliverables: ['Filed Form 11 and Form 8 with acknowledgements'],
      mistakes: ['Missing the dates, which brings a fee for every day late'],
      benefits: [pair('Stay active', 'Keeps the LLP in good standing.')],
      faqs: [qa('When are they due?', 'Form 11 by 30 May and Form 8 by 30 October each year.')],
    },
  },

  'secretarial-audit': {
    page: {
      intro:
        'A secretarial audit checks a company’s compliance with company law and related laws, and is reported in Form MR-3. It is required for listed companies and for some larger public companies.\nThis starts with a paid consultation; we then quote the audit.',
      whoFor: ['Listed companies', 'Larger public companies by capital, turnover or borrowings'],
      included: ['A consultation on whether and how the audit applies', 'A quote for the audit'],
      notIncluded: ['Fixing the gaps the audit finds, unless agreed'],
      documents: ['Statutory registers and minutes', 'ROC filings for the year', 'Board and committee records'],
      steps: consult('company'),
      timeline: ['How complete the records are'],
      costs: costs({extra: [pair('Audit fee', 'Quoted after the consultation.')]}),
      deliverables: ['Secretarial audit report (MR-3)'],
      mistakes: ['Registers and minutes not kept up to date'],
      benefits: [pair('Find gaps early', 'Fix compliance gaps before they become penalties.')],
      faqs: [qa('Does my company need one?', 'We check against the limits in the law for your company.')],
    },
  },

  'compliance-check': {
    page: {
      intro:
        'A compliance check reviews where your company or LLP stands: which filings are done, which are pending, and what penalties may apply. It gives you a clear list to fix.',
      whoFor: [
        'Founders unsure of their filing status',
        'Businesses before an investment or loan',
        'New management taking over',
      ],
      included: ['Review of ROC filings and records', 'A written report of gaps and fixes'],
      notIncluded: ['Filing the pending forms, which is quoted separately'],
      documents: [
        'Company or LLP name',
        'Registers, minutes and agreements you have',
        'Access to past filings, if any',
      ],
      steps: [
        step('Share details', 'Name and records you have.'),
        step('Review', 'We check public filings and your records.'),
        step('Report', 'You receive a list of gaps, risks and fixes.'),
      ],
      timeline: ['How many years are reviewed'],
      costs: costs(),
      deliverables: ['Written compliance report with a fix list'],
      mistakes: ['Waiting until a bank or investor finds the gaps'],
      benefits: [pair('A clear picture', 'Know exactly what is pending.')],
      faqs: [qa('Will you fix what you find?', 'Yes, if you want; each fix is quoted separately.')],
    },
  },

  'due-diligence': {
    page: {
      intro:
        'Due diligence is a structured review of a business before you invest in it, buy it, lend to it or partner with it: its legal standing, filings, contracts, licences and disputes.\nThis starts with a paid consultation; we then quote the review.',
      whoFor: ['Investors', 'Buyers of a business', 'Companies preparing to raise money'],
      included: ['A consultation on the scope', 'A quote for the review'],
      notIncluded: ['Financial audit, unless agreed', 'Negotiating the deal'],
      documents: ['Details of the target business', 'The data room or documents shared by it'],
      steps: consult('deal'),
      timeline: ['How quickly the target shares documents', 'The scope agreed'],
      costs: costs({extra: [pair('Review fee', 'Quoted after the consultation.')]}),
      deliverables: ['A written due diligence report with risks found'],
      mistakes: ['Signing before the review is finished'],
      benefits: [pair('Know the risks', 'Find problems before you commit money.')],
      faqs: [qa('What does it cover?', 'The scope is agreed with you: legal, secretarial, and other areas as needed.')],
    },
  },

  'rbi-compliance': {
    page: {
      intro:
        'Companies with foreign investment or overseas investments must report them to the RBI under FEMA, for example when issuing shares to a foreign investor and in the yearly return on foreign liabilities and assets.\nThis starts with a paid consultation; we then quote the filings.',
      whoFor: ['Companies with foreign investors', 'Companies investing abroad'],
      included: ['A consultation on the filings that apply', 'A quote for them'],
      notIncluded: ['Late submission fees set by the RBI'],
      documents: [
        'Details of the foreign investment',
        'Share allotment documents',
        'Bank papers for the money received',
      ],
      steps: consult('foreign investment'),
      timeline: ['The FEMA reporting deadlines', 'Bank and RBI processing'],
      costs: costs({extra: [pair('Filings', 'Quoted after the consultation.')]}),
      deliverables: ['The FEMA filings made with acknowledgements'],
      mistakes: ['Missing the reporting deadline after shares are issued'],
      benefits: [pair('Avoid penalties', 'Late FEMA reporting is penalised.')],
      faqs: [
        qa(
          'Which filings are common?',
          'FC-GPR for shares issued to foreign investors, FC-TRS for share transfers, and the yearly FLA return.',
        ),
      ],
    },
  },

  'add-director': change({
    intro:
      'Appointing a new director needs the person’s consent, a DIN and digital signature, a board or members’ decision, and a filing with the Registrar within 30 days.\nWe prepare everything and file it.',
    whoFor: ['Companies bringing in a new director'],
    decision: 'board resolution and the director’s consent',
    form: 'DIR-12',
    documents: ['PAN, Aadhaar, photo and address proof of the new director', 'Their DIN, if they have one'],
    deliverables: ['Filed DIR-12', 'Board resolution', 'The new director shown on the MCA records'],
    faqs: [qa('Does the new director need a DIN?', 'Yes. We apply for one if they do not have it.')],
  }),

  'remove-director': change({
    intro:
      'A director may resign, or the members may remove a director by resolution. Either way the company files the change with the Registrar within 30 days.\nWe prepare the documents and file it.',
    whoFor: ['Companies where a director is resigning or being removed'],
    decision: 'resignation letter or removal resolution',
    form: 'DIR-12',
    documents: ['The resignation letter, or the reason for removal', 'Date the change takes effect'],
    deliverables: ['Filed DIR-12', 'Board or members’ resolution'],
    mistakes: [
      'Leaving the company with fewer directors than the law needs',
      'Removing a director without the notice the law requires',
    ],
    faqs: [
      qa(
        'Can members remove a director?',
        'Yes, by an ordinary resolution after special notice, giving the director a chance to be heard.',
      ),
    ],
  }),

  'increase-capital': change({
    intro:
      'To issue more shares than its authorised capital allows, a company first increases its authorised capital by a members’ resolution and files Form SH-7 within 30 days. Stamp duty and ROC fees apply on the increase.\nWe prepare the resolutions and file the forms.',
    whoFor: ['Companies raising money or issuing new shares'],
    decision: 'members’ resolution and altered MOA',
    form: 'SH-7',
    documents: ['Current and proposed authorised capital'],
    deliverables: ['Filed SH-7', 'Altered MOA', 'Resolutions'],
    faqs: [
      qa(
        'Is allotting shares part of this?',
        'Increasing authorised capital and allotting shares are separate steps; allotment is quoted separately.',
      ),
    ],
  }),

  'change-name': change({
    intro:
      'Changing a company’s name needs the new name approved by the Registrar, a special resolution of the members, and the filings that follow. The company then gets a fresh certificate of incorporation.\nWe check names, file the application and update the documents.',
    whoFor: ['Companies rebranding or changing direction'],
    decision: 'special resolution and altered MOA and AOA',
    form: 'the name application and the change forms',
    documents: ['Up to two proposed names and their meaning', 'Trademark details, if the name is a brand'],
    deliverables: ['New certificate of incorporation', 'Altered MOA and AOA'],
    timeline: ['Name approval, which may need a second choice', 'The Registrar’s review'],
    mistakes: ['Choosing a name close to an existing company or trademark'],
    faqs: [qa('Do I need to update other registrations?', 'Yes: PAN, GST, bank and licences are updated separately.')],
  }),

  'change-address': change({
    intro:
      'Moving the registered office is filed with the Registrar. A move within the same city needs a board resolution; a move to another city or state needs more approvals.\nWe check what your move needs and file it.',
    whoFor: ['Companies moving their registered office'],
    decision: 'board or members’ resolution',
    form: 'INC-22 and the forms the move needs',
    documents: ['Proof of the new address (utility bill, and rent agreement or NOC)'],
    deliverables: ['Filed forms with acknowledgements', 'Resolutions'],
    timeline: ['Whether the move crosses city or state lines', 'Approvals needed for a move to another state'],
    faqs: [
      qa('Is moving to another state harder?', 'Yes. It needs approval from the Regional Director and takes longer.'),
    ],
  }),

  'change-objective': change({
    intro:
      'If your company will do business outside the objects in its MOA, the objects clause is changed by special resolution and filed with the Registrar.\nWe draft the new clause and file the change.',
    whoFor: ['Companies adding or changing their line of business'],
    decision: 'special resolution and altered objects clause',
    form: 'MGT-14 and the change forms',
    documents: ['A description of the new business activity'],
    deliverables: ['Altered MOA', 'Filed forms with acknowledgements'],
    faqs: [
      qa(
        'Do I need to change GST too?',
        'Usually the GST registration is updated for the new business; it is separate.',
      ),
    ],
  }),

  'close-company': {
    page: {
      intro:
        'A company can be closed by asking the Registrar to strike its name off, if it has no business and no liabilities, or by voluntary liquidation. We look at your company and tell you which route fits, then handle it.',
      whoFor: ['Companies that never started or have stopped business', 'Founders who want to close cleanly'],
      included: ['Advice on the right route to close', 'Preparation and filing for the chosen route'],
      notIncluded: [
        NOT_INCLUDED.gov,
        'Pending annual filings and their late fees',
        'Liquidator’s fees for a liquidation',
      ],
      documents: [
        'Company details',
        'Latest financial statements',
        'Bank account statement showing nil balance or closure',
        'Details of any liabilities',
      ],
      steps: [
        step('Review', 'We check filings, liabilities and the best route.'),
        step('Clear', 'Pending filings are completed and liabilities settled.'),
        step('Apply', 'We file the strike-off or start the liquidation.'),
        step('Closed', 'The company is struck off or dissolved.'),
      ],
      timeline: ['Pending filings', 'The Registrar’s public notice period'],
      costs: costs({gov: true}),
      deliverables: ['Filed closure application', 'Notice of strike-off once published'],
      mistakes: [
        'Applying with pending filings or open liabilities',
        'Simply abandoning the company, which keeps penalties running',
      ],
      benefits: [pair('Stop the fees', 'No more annual filings or late fees once closed.')],
      faqs: [qa('Which route is cheaper?', 'Strike-off, where the company qualifies. We check.')],
    },
  },

  'strike-off': {
    page: {
      intro:
        'A company that has no business and no liabilities can apply to the Registrar to strike its name off the register with Form STK-2, with the directors’ declarations.\nWe prepare and file the application.',
      whoFor: ['Companies that never started business', 'Companies inactive for two years'],
      included: [
        'Members’ special resolution',
        'STK-2 with the indemnity and affidavits',
        'Follow-up until the notice is published',
      ],
      notIncluded: [NOT_INCLUDED.gov, 'Pending annual filings and their late fees'],
      documents: [
        'Company details',
        'A statement of nil assets and liabilities',
        'Bank account closure letter',
        'Digital signatures of the directors',
      ],
      steps: [
        step('Check', 'We check the company qualifies and filings are up to date.'),
        step('Prepare', 'Resolution, indemnity and affidavits.'),
        step('File', 'We file STK-2.'),
        step('Struck off', 'The Registrar publishes the notice and strikes the name off.'),
      ],
      timeline: ['Pending filings', 'The Registrar’s notice period'],
      costs: costs({gov: true}),
      deliverables: ['Filed STK-2', 'The strike-off notice once published'],
      mistakes: ['Applying with money still in the bank account', 'Pending annual filings'],
      benefits: [pair('Close simply', 'The simplest way to close a company that has no liabilities.')],
      faqs: [
        qa(
          'Can a struck-off company be revived?',
          'In some cases, through an application to the tribunal, but it is not simple.',
        ),
      ],
    },
  },

  'close-llp': {
    page: {
      intro:
        'An LLP that has stopped business can apply to the Registrar to strike off its name, once its filings are up to date and it has no liabilities.\nWe prepare and file the application.',
      whoFor: ['LLPs that never started or have stopped business'],
      included: ['Partners’ consent and declarations', 'The strike-off application', 'Follow-up until it is closed'],
      notIncluded: [NOT_INCLUDED.gov, 'Pending annual filings and their late fees'],
      documents: [
        'LLP details',
        'A statement of nil assets and liabilities',
        'Bank account closure letter',
        'Digital signatures of the designated partners',
      ],
      steps: [
        step('Check', 'We check filings and liabilities.'),
        step('Prepare', 'Consents and declarations.'),
        step('File', 'We file the application.'),
        step('Closed', 'The Registrar strikes the LLP off.'),
      ],
      timeline: ['Pending filings', 'The Registrar’s review'],
      costs: costs({gov: true}),
      deliverables: ['Filed strike-off application', 'The closure notice once published'],
      mistakes: ['Pending Form 8 or Form 11 filings'],
      benefits: [pair('Stop the fees', 'No more yearly filings once closed.')],
      faqs: [qa('Do pending filings need to be done first?', 'Yes, the filings must be up to date.')],
    },
  },

  'add-partner': change({
    intro:
      'Adding a partner to an LLP is filed with the Registrar, and the LLP agreement is usually changed to show the new partner’s contribution and share. Both filings are due within 30 days.\nWe prepare the documents and file them.',
    whoFor: ['LLPs bringing in a new partner'],
    decision: 'partner’s consent and supplementary LLP agreement',
    form: 'Form 4 and Form 3',
    documents: ['PAN, Aadhaar, photo and address proof of the new partner', 'Their contribution and profit share'],
    deliverables: ['Filed Form 4 and Form 3', 'Supplementary LLP agreement'],
    faqs: [qa('Does the agreement need to change?', 'Usually yes, to record the new partner’s rights and share.')],
  }),

  'change-llp-agreement': change({
    intro:
      'Any change to an LLP agreement, such as profit shares, contributions or partners’ rights, is filed with the Registrar in Form 3 within 30 days.\nWe draft the supplementary agreement and file it.',
    whoFor: ['LLPs changing their agreement'],
    decision: 'supplementary LLP agreement',
    form: 'Form 3',
    documents: ['The current LLP agreement', 'The changes the partners agreed'],
    deliverables: ['Supplementary LLP agreement', 'Filed Form 3'],
    faqs: [qa('Is stamp duty payable?', 'Yes, on the agreement, at your state’s rate.')],
  }),
};
