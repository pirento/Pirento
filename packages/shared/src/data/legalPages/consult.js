// Consultation & Support: calls with professionals, complaints, immigration and business documents.
import {costs, pair, qa, step} from './common.js';

// A 30-minute call with a professional.
function talk({who, about, whoFor}) {
  return {
    page: {
      intro: `A 30-minute call with a ${who} to get clear answers on ${about}. Bring your questions and documents; you leave knowing your options and next steps.`,
      whoFor,
      included: [
        `A 30-minute call or video call with a ${who}`,
        'Answers to your questions on the call',
        'Next steps, and a quote if you need further work',
      ],
      notIncluded: ['Drafting, filings or representation after the call, quoted separately'],
      documents: ['Your questions, written down', 'Any documents or notices the questions are about'],
      steps: [
        step('Book', 'Buy the call and share your questions.'),
        step('Schedule', 'We confirm a time with you.'),
        step('Talk', `Speak with the ${who}.`),
        step('Next steps', 'Decide whether you need further help.'),
      ],
      timeline: ['Usually the same day, depending on when you are free'],
      costs: costs({extra: [pair('Further work', 'Only if you choose it, quoted after the call.')]}),
      deliverables: ['Advice on the call', 'Next steps'],
      mistakes: ['Coming without documents, so time goes in explaining'],
      benefits: [pair('Fast answers', 'Clear advice without a long engagement.')],
      faqs: [qa('Is the call confidential?', 'Yes. What you share is used only to advise you.')],
    },
  };
}

function immigration({kind, whoFor}) {
  return {
    page: {
      intro: `${kind} questions, such as visa options, documents and eligibility, are different for each person and country. This starts with a paid consultation with an immigration professional, who reviews your case and quotes any further work.`,
      whoFor,
      included: [
        'A consultation on your options',
        'A document checklist for your case',
        'A quote for further work, if you want it',
      ],
      notIncluded: ['Visa and embassy fees', 'Any guarantee of a visa, which only the embassy can grant'],
      documents: [
        'Passport',
        'Purpose of travel and destination country',
        'Education, work or family documents relevant to the visa',
      ],
      steps: [
        step('Book', 'Share your situation and destination.'),
        step('Consult', 'Talk through the options.'),
        step('Plan', 'Get a checklist and a quote for further help.'),
      ],
      timeline: ['Embassy processing, which we do not control'],
      costs: costs({extra: [pair('Further work', 'Quoted after the consultation; visa fees are extra.')]}),
      deliverables: ['Advice on the call', 'Document checklist'],
      mistakes: ['Applying with documents that do not match each other'],
      benefits: [pair('Know your route', 'Understand the visa options before you spend.')],
      faqs: [qa('Can you guarantee a visa?', 'No. The decision is the embassy’s alone.')],
    },
  };
}

export const CONSULT = {
  'talk-to-lawyer': talk({
    who: 'lawyer',
    about: 'any legal question: a dispute, a notice, a contract or your rights',
    whoFor: ['Anyone with a legal question', 'Before you sign, reply or file'],
  }),
  'talk-to-ca': talk({
    who: 'chartered accountant (CA)',
    about: 'income tax, GST, accounts and business finance',
    whoFor: ['Individuals with tax questions', 'Businesses with GST, TDS or accounting questions'],
  }),
  'talk-to-cs': talk({
    who: 'company secretary (CS)',
    about: 'company and LLP law, ROC filings and board matters',
    whoFor: ['Founders and directors', 'Companies and LLPs with compliance questions'],
  }),
  'talk-to-ip-lawyer': talk({
    who: 'IP lawyer',
    about: 'trademarks, copyright, patents and protecting your brand',
    whoFor: ['Brand owners, creators and inventors'],
  }),

  'consumer-complaint': {
    page: {
      intro:
        'If a seller or service provider does not resolve your complaint, you can file a case before the consumer commission under the Consumer Protection Act, 2019, often online through e-Daakhil. The commission depends on the value of your claim.\nWe draft and file the complaint.',
      whoFor: ['Consumers with a faulty product, deficient service or unfair trade practice'],
      included: ['Complaint drafted with the facts and relief claimed', 'Filing before the right consumer commission'],
      notIncluded: ['Commission fees', 'Appearing at hearings, unless the package lists it'],
      documents: ['Bill or invoice', 'Proof of the defect or deficiency', 'Notices and replies so far', 'ID proof'],
      steps: [
        step('Share the facts', 'What went wrong, with documents.'),
        step('Draft', 'We draft the complaint.'),
        step('File', 'We file it, online where possible.'),
        step('Hearing', 'The commission issues notice and hears the case.'),
      ],
      timeline: ['The commission’s hearing dates'],
      costs: costs({gov: true, govNote: 'The commission’s fee, which depends on the value of the claim.'}),
      deliverables: ['Filed complaint with its number'],
      mistakes: [
        'Filing in the wrong commission for the claim value',
        'Filing more than two years after the cause arose without a reason for the delay',
      ],
      benefits: [pair('A consumer forum', 'Built to resolve consumer disputes more simply than civil courts.')],
      faqs: [
        qa(
          'Which commission do I go to?',
          'District for claims up to ₹50 lakh, State up to ₹2 crore, and National above that, under the current limits.',
        ),
      ],
    },
  },

  'online-complaint': {
    page: {
      intro:
        'For online fraud, cyber crime or harassment, complaints can be filed on the National Cyber Crime Reporting Portal (cybercrime.gov.in). For money lost to online fraud, call the 1930 helpline at once.\nWe help you prepare and file a clear complaint.',
      whoFor: ['Victims of online fraud', 'People facing online harassment or impersonation'],
      included: ['A complaint drafted with the facts and evidence', 'Help filing on the portal or with the police'],
      notIncluded: ['Recovering money, which depends on the police and banks', 'Court proceedings'],
      documents: ['Screenshots, messages and links', 'Bank or UPI transaction details', 'ID proof'],
      steps: [
        step('Act fast', 'For money lost, call 1930 first.'),
        step('Share evidence', 'Screenshots and transaction details.'),
        step('Draft', 'We write a clear complaint.'),
        step('File', 'We help you file it and keep the acknowledgement.'),
      ],
      timeline: ['Reporting quickly matters most for money lost'],
      costs: costs(),
      deliverables: ['Filed complaint with acknowledgement'],
      mistakes: ['Deleting messages or chats that are evidence', 'Waiting days before reporting a fraud'],
      benefits: [pair('A clear record', 'A well-written complaint helps the police act.')],
      faqs: [qa('Is there a helpline for financial fraud?', 'Yes, 1930, the national cyber crime helpline.')],
    },
  },

  'corporate-immigration': immigration({
    kind: 'Business and work visa',
    whoFor: ['Companies sending staff abroad', 'Companies hiring foreign nationals'],
  }),
  'family-immigration': immigration({
    kind: 'Family and dependant visa',
    whoFor: ['Families joining a relative abroad'],
  }),
  'student-immigration': immigration({kind: 'Student visa', whoFor: ['Students planning to study abroad']}),
  'immigration-lawyer': immigration({
    kind: 'Immigration',
    whoFor: ['Anyone with a visa refusal, status or immigration question'],
  }),

  'pitch-deck': {
    page: {
      intro:
        'A pitch deck tells investors what you do, why it matters and why now, in a few clear slides. We write and design a deck from your business details.',
      whoFor: ['Startups raising money', 'Founders applying to accelerators or competitions'],
      included: ['Deck structure and content written with you', 'Design in an editable format', 'One round of changes'],
      notIncluded: ['Financial projections beyond what you provide, unless agreed', 'Introductions to investors'],
      documents: [
        'What the business does and for whom',
        'Traction, team and numbers you have',
        'How much you are raising and for what',
      ],
      steps: [
        step('Brief', 'We learn the business and the raise.'),
        step('Story', 'We agree the outline.'),
        step('Draft', 'We write and design the deck.'),
        step('Revise', 'You comment; we revise once.'),
      ],
      timeline: ['How quickly you share details and feedback'],
      costs: costs(),
      deliverables: ['Pitch deck in an editable file and PDF'],
      mistakes: ['Too many slides and too much text', 'Numbers that do not match your financials'],
      benefits: [pair('A clear story', 'Investors understand the business quickly.')],
      faqs: [qa('Does a deck guarantee funding?', 'No. It helps you present clearly; investors decide.')],
    },
  },

  'business-loan': {
    page: {
      intro:
        'Getting a business loan needs the right lender, scheme and documents. This starts with a paid consultation: we review your business and needs, and explain the options and paperwork.',
      whoFor: ['Small businesses seeking working capital or a term loan'],
      included: [
        'A consultation on loan options and schemes',
        'A document checklist',
        'A quote for preparing the application, if you want it',
      ],
      notIncluded: ['Loan approval, which only the lender decides', 'Lender processing fees'],
      documents: ['Business registration and GST', 'Bank statements and ITRs', 'Financial statements'],
      steps: [
        step('Consult', 'We review your business and needs.'),
        step('Options', 'Lenders and schemes that may fit.'),
        step('Prepare', 'Documents and application, if you choose.'),
      ],
      timeline: ['The lender’s review'],
      costs: costs({extra: [pair('Application work', 'Quoted after the consultation.')]}),
      deliverables: ['Advice and a document checklist'],
      mistakes: ['Applying to many lenders at once, which can hurt your credit profile'],
      benefits: [pair('Better prepared', 'A complete application avoids delays.')],
      faqs: [
        qa('Do you lend money?', 'No. We help you prepare; lenders decide. Pirento Capital has not started lending.'),
      ],
    },
  },

  dpr: {
    page: {
      intro:
        'A detailed project report (DPR) sets out a project’s plan, costs, financing and expected returns, for banks, investors or government schemes.\nThis starts with a paid consultation; we then quote the report.',
      whoFor: ['Businesses applying for a term loan or subsidy', 'New manufacturing or infrastructure projects'],
      included: ['A consultation on the project and the report’s purpose', 'A quote for the report'],
      notIncluded: ['Approval of the loan or scheme'],
      documents: [
        'Project description and location',
        'Cost estimates and quotations',
        'Promoters’ details and financials',
      ],
      steps: [
        step('Consultation', 'We understand the project and who the report is for.'),
        step('Data', 'You share costs and plans.'),
        step('Report', 'We prepare the DPR.'),
        step('Revise', 'We revise after your review.'),
      ],
      timeline: ['How complete the project data is'],
      costs: costs({extra: [pair('Report', 'Quoted after the consultation.')]}),
      deliverables: ['Detailed project report'],
      mistakes: ['Cost estimates without supplier quotations'],
      benefits: [pair('Lender-ready', 'A report in the form banks and schemes expect.')],
      faqs: [qa('Does a DPR guarantee a loan?', 'No. It presents the project; the lender decides.')],
    },
  },
};
