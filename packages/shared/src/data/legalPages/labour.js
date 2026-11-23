// Labour Law and Litigation: the pages of these services.
import {NOT_INCLUDED, costs, pair, qa, step} from './common.js';

const employerDocs = [
  'Business registration and PAN',
  'Address proof of the establishment',
  'List of employees with wages and joining dates',
  'Bank details',
];

// An employer registration: same shape, with each scheme's facts.
function registration({intro, whoFor, scheme, faqs, deliverables, monthly}) {
  return {
    page: {
      intro,
      whoFor,
      included: [
        `${scheme} registration application`,
        'Login and code for the employer',
        'A note of the monthly filings',
      ],
      notIncluded: [NOT_INCLUDED.gov, monthly],
      documents: employerDocs,
      steps: [
        step('Share details', 'Business and employee details.'),
        step('Apply', `We file the ${scheme} registration.`),
        step('Registered', 'You receive the registration code.'),
        step('Start filing', 'Monthly contributions and returns follow.'),
      ],
      timeline: ['Verification by the department'],
      costs: costs({gov: true}),
      deliverables,
      mistakes: ['Registering late after crossing the employee limit', 'Missing monthly payments after registering'],
      benefits: [pair('Protect your team', 'Employees get the benefits the law gives them.')],
      faqs,
    },
  };
}

// Litigation work starts with a paid consultation with a lawyer.
function lawyer({area, intro, whoFor, documents, faqs}) {
  return {
    page: {
      intro: `${intro}\nThis starts with a paid consultation. The lawyer reviews your facts, explains your options and the likely steps, and quotes any further work.`,
      whoFor,
      included: [
        `A consultation with a lawyer experienced in ${area}`,
        'Your options explained in plain words',
        'A quote for further work, if you want it',
      ],
      notIncluded: ['Notices, filings, court appearances and court fees, quoted after the consultation'],
      documents: [...documents, 'A short timeline of what happened'],
      steps: [
        step('Book', 'Pick a time and share your documents.'),
        step('Consult', 'Talk to the lawyer by call or video.'),
        step('Plan', 'Agree the next step and its quote, if any.'),
      ],
      timeline: ['Courts and authorities set their own pace; the lawyer explains what to expect'],
      costs: costs({
        extra: [pair('Further work', 'Quoted after the consultation; court fees and expenses are extra.')],
      }),
      deliverables: ['Advice on your matter', 'A written note of next steps, on request'],
      mistakes: ['Waiting until a limitation period has passed', 'Signing settlements before taking advice'],
      benefits: [pair('Know where you stand', 'Clear advice before you decide.')],
      faqs: [qa('Can the lawyer guarantee a result?', 'No lawyer can. They advise on the law and the facts.'), ...faqs],
    },
  };
}

export const LABOUR = {
  pf: registration({
    intro:
      'Employee Provident Fund (EPF) registration is required for establishments with 20 or more employees, and can be taken voluntarily below that. Employer and employee both contribute every month.\nWe register your establishment with the EPFO.',
    whoFor: ['Establishments with 20 or more employees', 'Smaller employers who choose to register'],
    scheme: 'EPF',
    monthly: 'Monthly ECR filing and contributions, unless the package lists them',
    deliverables: ['EPF establishment code', 'Employer login'],
    faqs: [qa('When are contributions due?', 'By the 15th of the following month.')],
  }),
  esi: registration({
    intro:
      'Employees’ State Insurance (ESI) gives medical and cash benefits to employees earning up to the wage limit. It applies to establishments with 10 or more employees in areas where the scheme is notified.\nWe register your establishment with ESIC.',
    whoFor: ['Establishments with 10 or more employees in notified areas'],
    scheme: 'ESIC',
    monthly: 'Monthly contributions and returns, unless the package lists them',
    deliverables: ['ESIC employer code', 'Employer login'],
    faqs: [qa('Who is covered?', 'Employees earning up to ₹21,000 a month, under the current limit.')],
  }),
  'professional-tax': registration({
    intro:
      'Professional tax is a state tax on employment and professions, collected in the states that levy it. Employers deduct it from salaries and register to pay it.\nWe register you under your state’s professional tax law.',
    whoFor: ['Employers in states that levy professional tax', 'Professionals and businesses in those states'],
    scheme: 'Professional tax',
    monthly: 'Periodic returns and payments, unless the package lists them',
    deliverables: ['Professional tax registration certificate(s)'],
    faqs: [qa('Does every state charge it?', 'No. Only some states levy it; we check yours.')],
  }),
  'shop-license': {
    page: {
      intro:
        'Shops, offices and other commercial establishments register under their state’s Shops and Establishments Act, usually soon after starting. The Act also sets working hours, holidays and leave.\nWe register your establishment.',
      whoFor: ['Shops, offices, restaurants and other establishments'],
      included: ['Registration application under your state’s Act', 'Follow-up until the certificate is issued'],
      notIncluded: [NOT_INCLUDED.gov, 'Renewals, where your state needs them'],
      documents: ['ID and photo of the owner', 'Proof of the premises', 'Number of employees', 'Business details'],
      steps: [
        step('Share details', 'Owner, premises and staff.'),
        step('Apply', 'We file with your state’s labour department.'),
        step('Certificate', 'You receive the registration certificate.'),
      ],
      timeline: ['Your state’s processing time'],
      costs: costs({gov: true}),
      deliverables: ['Shops and Establishments registration certificate'],
      mistakes: ['Not displaying the certificate at the premises', 'Missing a renewal where one is needed'],
      benefits: [pair('Proof of business', 'Often asked for by banks for a current account.')],
      faqs: [qa('Is it the same in every state?', 'No. Each state has its own Act and process.')],
    },
  },
  esop: {
    page: {
      intro:
        'An Employee Stock Option Plan (ESOP) lets a company grant employees options to buy shares later, to reward and retain them. For a company it needs a scheme, board and members’ approval, and filings with the Registrar.\nThis starts with a paid consultation; we then quote the plan.',
      whoFor: ['Startups and companies rewarding key employees'],
      included: ['A consultation on the plan design', 'A quote for drafting and approvals'],
      notIncluded: [NOT_INCLUDED.gov, 'Share valuation reports'],
      documents: ['Current shareholding', 'How many options and for whom', 'Vesting and exit terms you have in mind'],
      steps: [
        step('Consultation', 'We discuss the pool, vesting and terms.'),
        step('Draft', 'We draft the scheme and grant letters.'),
        step('Approve', 'Board and members approve; filings follow.'),
        step('Grant', 'Options are granted to employees.'),
      ],
      timeline: ['Approvals and meetings'],
      costs: costs({gov: true, extra: [pair('Plan work', 'Quoted after the consultation.')]}),
      deliverables: ['ESOP scheme', 'Grant letter template', 'Resolutions and filings'],
      mistakes: ['Promising options without a formal scheme'],
      benefits: [pair('Retain your team', 'Employees share in the company’s growth.')],
      faqs: [
        qa('Is there a minimum vesting period?', 'Yes, at least one year between grant and vesting for companies.'),
      ],
    },
  },
  posh: {
    page: {
      intro:
        'The Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013 requires every employer with 10 or more employees to form an Internal Committee, have a policy, and report each year.\nWe set up your POSH compliance.',
      whoFor: ['Employers with 10 or more employees'],
      included: [
        'POSH policy for your workplace',
        'Guidance on forming the Internal Committee',
        'Format for the annual report',
      ],
      notIncluded: ['The external member’s fees', 'Investigating complaints'],
      documents: ['Number of employees and locations', 'Names of proposed committee members'],
      steps: [
        step('Understand', 'Your workplace and team.'),
        step('Policy', 'We draft the POSH policy.'),
        step('Committee', 'We guide forming the Internal Committee.'),
        step('Report', 'You get the annual report format.'),
      ],
      timeline: ['Choosing committee members'],
      costs: costs(),
      deliverables: ['POSH policy', 'Committee formation documents', 'Annual report format'],
      mistakes: ['Forming the committee without an external member', 'Not filing the annual report'],
      benefits: [pair('A safer workplace', 'A clear way to raise and resolve complaints.')],
      faqs: [
        qa(
          'Who must be on the committee?',
          'A senior woman employee as presiding officer, employee members, and an external member.',
        ),
      ],
    },
  },
  'labour-compliance': {
    page: {
      intro:
        'Employers must keep registers, pay at least minimum wages, and file returns under central and state labour laws. Requirements depend on your state, industry and headcount.\nThis starts with a paid consultation; we then agree the monthly scope.',
      whoFor: ['Employers who want their labour compliance handled each month'],
      included: ['A consultation on the laws that apply to you', 'A quote for monthly compliance'],
      notIncluded: ['Contributions and fees payable to the government'],
      documents: employerDocs,
      steps: [
        step('Consultation', 'We list the laws that apply.'),
        step('Scope', 'We agree the monthly work.'),
        step('Monthly', 'Registers, returns and reminders each month.'),
      ],
      timeline: ['The scope agreed'],
      costs: costs({extra: [pair('Monthly fee', 'Agreed after the consultation.')]}),
      deliverables: ['Filed returns and maintained registers, as agreed'],
      mistakes: ['Assuming one state’s rules apply in another'],
      benefits: [pair('Fewer inspections surprises', 'Records ready when asked.')],
      faqs: [qa('Do labour laws differ by state?', 'Yes, many rules are set by each state.')],
    },
  },
  'labour-advisor': lawyer({
    area: 'labour and employment law',
    intro:
      'For questions on hiring, wages, termination, contracts and labour inspections, a labour law advisor gives you clear advice.',
    whoFor: ['Employers', 'Employees with a workplace issue'],
    documents: ['Employment contracts or offer letters', 'Notices or letters received'],
    faqs: [],
  }),

  'criminal-lawyer': lawyer({
    area: 'criminal law',
    intro:
      'If you are facing a police complaint or FIR, need bail, or are a victim of a crime, a criminal lawyer explains your rights and the next steps.',
    whoFor: ['Anyone accused in, or affected by, a criminal matter'],
    documents: ['FIR, complaint or notice', 'Any court papers'],
    faqs: [
      qa(
        'Should I speak to the police before taking advice?',
        'You can cooperate, but take legal advice as early as you can.',
      ),
    ],
  }),
  'divorce-lawyer': lawyer({
    area: 'divorce and matrimonial law',
    intro:
      'Divorce can be by mutual consent or contested, and involves maintenance, custody and property. A divorce lawyer explains the routes that apply to you.',
    whoFor: ['Spouses considering separation or divorce'],
    documents: ['Marriage certificate or proof of marriage', 'Any notices or court papers'],
    faqs: [qa('Is mutual consent divorce faster?', 'Usually, yes, when both agree on all terms.')],
  }),
  'family-lawyer': lawyer({
    area: 'family law',
    intro:
      'For wills, inheritance, property between family members, guardianship and other family matters, a family lawyer advises you.',
    whoFor: ['Families with property, succession or guardianship questions'],
    documents: ['Wills, property papers or family records'],
    faqs: [],
  }),
  'banking-lawyer': lawyer({
    area: 'banking and finance law',
    intro:
      'For loan recovery notices, SARFAESI action, disputes with a bank or NBFC, and loan documents, a banking lawyer advises you.',
    whoFor: ['Borrowers facing recovery action', 'Businesses in a dispute with a lender'],
    documents: ['Loan agreements', 'Notices from the bank or NBFC'],
    faqs: [],
  }),
  'consumer-lawyer': lawyer({
    area: 'consumer law',
    intro:
      'If a seller or service provider has let you down and will not fix it, a consumer lawyer advises on a notice or a complaint before the consumer commission.',
    whoFor: ['Consumers with a dispute', 'Businesses facing a consumer complaint'],
    documents: ['Bills, warranty and complaints made'],
    faqs: [],
  }),
  'labour-lawyer': lawyer({
    area: 'labour law disputes',
    intro:
      'For wrongful termination, unpaid wages, and disputes before labour authorities or courts, a labour lawyer advises you.',
    whoFor: ['Employees with a dispute', 'Employers facing a claim'],
    documents: ['Employment contract, payslips and termination letter'],
    faqs: [],
  }),
  'litigation-lawyer': lawyer({
    area: 'civil litigation',
    intro:
      'For civil disputes over contracts, money, property and business, a litigation lawyer reviews your case and explains your options in and out of court.',
    whoFor: ['Individuals and businesses in a civil dispute'],
    documents: ['Agreements, letters and court papers'],
    faqs: [],
  }),
  'ip-lawyer': lawyer({
    area: 'intellectual property',
    intro:
      'For trademark, copyright, patent and design questions, including disputes and licensing, an IP lawyer advises you.',
    whoFor: ['Creators, brands and inventors'],
    documents: ['Registrations or applications', 'Evidence of the dispute, if any'],
    faqs: [],
  }),
  'trademark-lawyer': lawyer({
    area: 'trademarks',
    intro: 'For trademark objections, oppositions, infringement and brand strategy, a trademark lawyer advises you.',
    whoFor: ['Brand owners and applicants'],
    documents: ['Trademark application or registration', 'Notices or reports received'],
    faqs: [],
  }),
  tmt: lawyer({
    area: 'technology, media and telecom (TMT) law',
    intro:
      'For apps, online platforms, data protection, IT Act issues, content and telecom questions, a TMT lawyer advises your business.',
    whoFor: ['Tech companies and online platforms', 'Media and content businesses'],
    documents: ['What your product does', 'Contracts or notices involved'],
    faqs: [
      qa(
        'Does the data protection law apply to us?',
        'If you process personal data in digital form in India, the DPDP Act, 2023 likely applies.',
      ),
    ],
  }),
  'risk-advisory': {
    page: {
      intro:
        'A legal risk review looks at your business’s contracts, compliance and processes, and lists the legal risks with practical steps to reduce them.\nThis starts with a paid consultation; we then quote the review.',
      whoFor: ['Growing businesses', 'Businesses entering a new market or product'],
      included: ['A consultation on the areas to review', 'A quote for the review'],
      notIncluded: ['Fixing the issues found, unless agreed'],
      documents: ['Key contracts', 'Registrations and licences', 'Policies in place'],
      steps: [
        step('Consultation', 'We agree the areas to review.'),
        step('Review', 'We study your documents and processes.'),
        step('Report', 'You receive risks ranked with steps to take.'),
      ],
      timeline: ['The scope agreed'],
      costs: costs({extra: [pair('Review', 'Quoted after the consultation.')]}),
      deliverables: ['Written risk report'],
      mistakes: ['Treating legal risk only after a dispute starts'],
      benefits: [pair('Fewer surprises', 'Fix risks before they cost you.')],
      faqs: [qa('Is it an audit?', 'It is a legal review of the areas agreed, not a financial audit.')],
    },
  },
};
