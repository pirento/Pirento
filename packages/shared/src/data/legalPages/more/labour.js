// More questions, common mistakes and benefits for the Labour Law and Litigation pages (added to their sections).
const LAWYER = {
  f: [
    [
      'What happens in the consultation?',
      'You explain the matter and share documents; the lawyer tells you your options, the likely steps and what the full work would cost.',
    ],
    [
      'Is what I share confidential?',
      'Yes. Communications with your advocate are privileged, and we share your documents only with the lawyer on your matter.',
    ],
  ],
  m: ['Giving an incomplete story, which changes the advice later'],
  b: [
    ['A quote before you commit', 'The fee for the full matter is agreed after the consultation.'],
    ['The right lawyer', 'Your matter goes to someone who handles that kind of case.'],
  ],
};

const lawyer = (q, a, mistake) => ({
  f: [[q, a], ...LAWYER.f],
  m: [mistake, ...LAWYER.m],
  b: LAWYER.b,
});

export const MORE_LABOUR = {
  pf: {
    f: [
      [
        'When does a business need PF?',
        'Once it employs 20 or more people, in most establishments covered by the EPF Act. Smaller ones may join voluntarily.',
      ],
      [
        'What is the UAN?',
        'The universal account number each employee keeps across jobs, so their PF moves with them.',
      ],
    ],
    m: ['Paying PF on a lower wage than the law counts'],
    b: [['Retirement savings for staff', 'Employees build savings and pension with every month’s contribution.']],
  },
  esi: {
    f: [
      ['When does a business need ESI?', 'Usually once it employs 10 or more people in an area where ESI applies.'],
      [
        'What do employees get?',
        'Medical care for them and their family, and cash benefits for sickness, maternity and injury at work.',
      ],
    ],
    m: ['Not generating ESI cards for new joiners'],
    b: [['Medical cover for staff', 'Treatment at ESI hospitals and dispensaries.']],
  },
  'professional-tax': {
    f: [
      [
        'Who pays it?',
        'The employer deducts it from salaries and pays it to the state; the business and some professionals may also pay their own.',
      ],
      ['How much is it?', 'Each state sets slabs, with a yearly limit of ₹2,500 per person under the Constitution.'],
    ],
    m: ['Not registering the business itself where the state requires it'],
    b: [['No penalties', 'Timely payment avoids interest and penalty from the state.']],
  },
  'shop-license': {
    f: [
      [
        'Who needs it?',
        'Shops, offices, restaurants and other establishments, under the state’s Shops and Establishments Act.',
      ],
      [
        'Does it cover working hours and holidays?',
        'Yes. The Act sets hours, weekly offs and leave, which the registration commits you to follow.',
      ],
    ],
    m: ['Not reporting a change in the number of employees where the state asks'],
    b: [['Bank ready', 'A common document banks accept to open a current account.']],
  },
  esop: {
    f: [
      [
        'Who can get options?',
        'Employees and directors, other than promoters and those holding more than 10% of shares, under the Companies Act rules.',
      ],
      [
        'How are options taxed?',
        'Usually as salary when they are exercised and again as capital gains when the shares are sold.',
      ],
    ],
    m: ['Granting more options than the pool approved by shareholders'],
    b: [['Ownership for your team', 'Staff share in the company’s growth.']],
  },
  posh: {
    f: [
      ['Who must have an Internal Committee?', 'Every workplace with 10 or more employees.'],
      ['Is training required?', 'The law expects employers to run awareness programmes and train the committee.'],
    ],
    m: ['Not displaying the policy and committee details at the workplace'],
    b: [['Meet the law', 'The policy, committee and annual report the POSH Act asks for.']],
  },
  'labour-compliance': {
    f: [
      [
        'What is covered each month?',
        'PF, ESI, professional tax and labour welfare fund payments and returns, and the registers your state needs, as the package lists.',
      ],
      [
        'What about the new labour codes?',
        'We follow the rules in force in your state and update you as the codes take effect.',
      ],
    ],
    m: ['Keeping no attendance and wage registers'],
    b: [
      ['One team for every filing', 'Payroll compliance handled together each month.'],
      ['Ready for inspection', 'Registers and returns are kept up to date.'],
    ],
  },
  'labour-advisor': lawyer(
    'Which matters do you advise on?',
    'Hiring and termination, wages, PF and ESI, standing orders, disputes and settlements with staff.',
    'Terminating staff without following the notice and settlement rules',
  ),
  'criminal-lawyer': lawyer(
    'Can you help with bail?',
    'Yes. The lawyer advises on anticipatory or regular bail and the court to approach.',
    'Signing a statement without understanding it',
  ),
  'divorce-lawyer': lawyer(
    'How long does a mutual consent divorce take?',
    'There is a cooling-off period of six months after the first motion, which the court may waive in suitable cases.',
    'Moving out of the shared home without advice on its effect',
  ),
  'family-lawyer': lawyer(
    'Which matters do you take?',
    'Maintenance, custody, guardianship, wills and succession, and partition among family members.',
    'Acting on an unregistered family settlement without advice',
  ),
  'banking-lawyer': lawyer(
    'Can you help with a bank’s recovery notice?',
    'Yes. The lawyer reviews notices under SARFAESI or from a DRT and advises on the reply and options.',
    'Ignoring a notice under section 13(2) of SARFAESI',
  ),
  'consumer-lawyer': lawyer(
    'Do I need a lawyer at the consumer commission?',
    'Not always; you can appear yourself. A lawyer helps with drafting and with hearings in larger claims.',
    'Not keeping the bill, warranty and complaint emails',
  ),
  'labour-lawyer': lawyer(
    'Can you represent us before the labour court?',
    'Yes, for employers and employees, after the consultation and an agreed fee.',
    'Settling dues without a written settlement',
  ),
  'litigation-lawyer': lawyer(
    'Which courts do you appear in?',
    'District courts, High Courts and tribunals, depending on the matter and city; we confirm before you engage.',
    'Missing the date to reply to a court summons',
  ),
  'ip-lawyer': lawyer(
    'Do you handle licensing too?',
    'Yes: licences, assignments, and disputes over trademarks, copyright, designs and patents.',
    'Using a brand before checking it is free',
  ),
  'trademark-lawyer': lawyer(
    'Can you handle an opposition?',
    'Yes, filing or defending an opposition and the hearings that follow.',
    'Missing the four-month window to oppose a mark',
  ),
  tmt: lawyer(
    'What does TMT cover?',
    'Technology, media and telecom: software and SaaS contracts, data protection, content, platforms and IT Act matters.',
    'Collecting personal data without a privacy notice',
  ),
  'risk-advisory': {
    f: [
      [
        'What do I get?',
        'A written review of the legal risks in your contracts, licences, data and people practices, ranked by priority, with steps to reduce them.',
      ],
      ['How long does it take?', 'Usually 10 to 15 days after we receive your documents.'],
    ],
    m: ['Reviewing only contracts and leaving out licences and data'],
    b: [['A plan you can act on', 'Clear priorities for what to fix first.']],
  },
};
