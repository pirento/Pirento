// The last lines that bring every Legal page to at least four questions and three of each list (w, i, doc, s, out, f).
const q = (question, answer) => ({f: [[question, answer]]});
const CONSULT_DOCS = ['A short timeline of what happened, in your words'];
const ASK = (question, answer, extra = {}) => ({...q(question, answer), ...extra});

export const MORE_SECTIONS_EXTRA = {
  opc: q('Can an OPC have more than one director?', 'Yes. It needs at least one director and can have up to fifteen.'),
  'udyam-msme': q(
    'Can a trader register on Udyam?',
    'Retail and wholesale traders can register for priority sector lending, as the government allows.',
  ),
  fssai: q(
    'Do I need a separate licence for each outlet?',
    'Usually yes. Each premises needs its own registration or licence.',
  ),
  iec: q(
    'Can an individual get an IEC?',
    'Yes. Individuals, proprietors, firms and companies can all apply with their PAN.',
  ),
  'trade-license': q(
    'Can I apply before the shop opens?',
    'Yes, once you have the premises; some local bodies inspect before granting it.',
  ),
  iso: q(
    'How long does certification take?',
    'Often one to three months, depending on how ready your records are and when the audit is booked.',
  ),
  bis: q(
    'What is the difference between ISI and CRS?',
    'ISI marking is a licence for products under the product certification scheme; CRS is the compulsory registration scheme for many electronics and IT products.',
  ),
  hallmark: ASK(
    'Does each piece need a hallmark?',
    'Gold jewellery and artefacts covered by the order need it before sale, with a few exempt items such as very light pieces.',
    {out: ['A note of the renewal and record-keeping rules']},
  ),
  dsc: q(
    'Can I use one DSC for many companies?',
    'Yes. A DSC belongs to the person and works for every company or filing they sign.',
  ),
  'gst-registration': q(
    'How long does registration take?',
    'Usually within a week or two if no clarification is asked, or longer if the officer visits or asks questions.',
  ),
  'gst-filing': q(
    'What is GSTR-2B?',
    'An auto-drafted statement of the input tax credit available to you each month, from your suppliers’ filings.',
  ),
  'gst-cancellation': q(
    'Can I register again later?',
    'Yes. A new registration can be taken whenever the business needs it again.',
  ),
  'gst-revocation': q(
    'Do I file the pending returns myself?',
    'We file them for you as part of the work, once you share the sales and purchase data.',
  ),
  'hsn-code-finder': q(
    'How many digits must I show?',
    'Four or six digits, depending on turnover, and eight for some goods and exports.',
  ),
  'tds-filing': q(
    'Is a TAN needed?',
    'Yes. Anyone deducting TDS needs a TAN; we can apply for one if you do not have it.',
  ),
  'itr-filing': q(
    'Do I need to file if my income is below the limit?',
    'Not always, but filing helps with loans, visas and refunds, and is needed in some cases such as high spending or foreign assets.',
  ),
  'proprietorship-tax': q(
    'Can losses be carried forward?',
    'Business losses can be carried forward for up to eight years if the return is filed on time.',
  ),
  'llp-tax': q(
    'Do partners file separately?',
    'Yes. Each partner files their own return, showing remuneration and interest from the LLP.',
  ),
  'corporate-tax': q(
    'What is MAT?',
    'Minimum alternate tax: a minimum tax on book profit, which companies on the new concessional rates do not pay.',
  ),
  'tax-assessment': q(
    'What is the difference between scrutiny and an intimation?',
    'An intimation (under section 143(1)) is an automatic check of the return; scrutiny is a fuller assessment by an officer.',
  ),
  'tax-notice': q(
    'What is the most common notice?',
    'An intimation under section 143(1) after processing, often about a mismatch with AIS or Form 26AS.',
  ),
  'reply-to-notice': q(
    'What if I disagree with the officer’s order?',
    'You can appeal within the time limit; we tell you whether an appeal is worth it.',
  ),
  'virtual-cfo': q(
    'Can it start mid-year?',
    'Yes. We begin by reviewing the books so far and set the plan from there.',
  ),
  'annual-compliance': q(
    'Who appoints the auditor?',
    'The board appoints the first auditor within 30 days of incorporation; members appoint later ones at the AGM.',
  ),
  'llp-filing': ASK(
    'Is an audit needed?',
    'Only when the LLP’s turnover or contribution crosses the limits in the LLP rules.',
    {out: ['A note of any penalty if a past year was missed']},
  ),
  'secretarial-audit': ASK(
    'What if the report has qualifications?',
    'The board must explain each one in its report to members, so it helps to fix gaps early.',
    {out: ['A meeting to explain the findings']},
  ),
  'compliance-check': ASK('How long does it take?', 'Usually a week or two after we receive access to the records.', {
    out: ['A summary you can share with a bank or investor'],
  }),
  'due-diligence': ASK(
    'Can it be limited to some areas?',
    'Yes. We agree the scope at the start, for example only legal and tax.',
    {out: ['Answers to follow-up questions on the report']},
  ),
  'rbi-compliance': ASK(
    'Do you file through the FIRMS portal?',
    'Yes. FEMA reports such as FC-GPR and FC-TRS are filed on RBI’s FIRMS portal through your bank.',
    {out: ['Copies of the bank and RBI acknowledgements']},
  ),
  'add-director': q(
    'Is there a limit on directors?',
    'A private company can have up to fifteen directors, or more with a special resolution.',
  ),
  'remove-director': q(
    'Can a director be removed before their term ends?',
    'Yes, by an ordinary resolution of members after a special notice, with the director given a chance to be heard.',
  ),
  'increase-capital': q('Which form is filed?', 'Form SH-7, within 30 days of the members’ resolution.'),
  'change-name': q('Which forms are filed?', 'Name reservation through RUN, then INC-24 with the special resolution.'),
  'change-address': q(
    'Which form is filed for another state?',
    'INC-23 to the Regional Director first, then INC-22 once approved.',
  ),
  'change-objective': q('Does the change need members’ approval?', 'Yes, a special resolution of the members.'),
  'close-company': ASK(
    'Is a closure published?',
    'Yes. The Registrar publishes a notice and waits for objections before striking the company off.',
    {i: ['Closing of the company’s GST and other registrations, as you need']},
  ),
  'strike-off': q(
    'Do pending filings need to be done first?',
    'Usually yes, the accounts and annual returns up to when business stopped.',
  ),
  'close-llp': ASK('How long does it take?', 'A few months, including the notice period for objections.', {
    w: ['LLPs inactive for a year or more'],
  }),
  'add-partner': q('Can a company be a partner?', 'Yes. A company can be a partner in an LLP through a nominee.'),
  'change-llp-agreement': q(
    'Do all partners have to agree?',
    'Changes follow the rules in the agreement; where it is silent, all partners must agree.',
  ),
  'trademark-registration': {
    out: ['The TM application number to use with ™ straight away'],
    f: [
      [
        'Can I register a logo and a name together?',
        'They can be filed as one combined mark, but filing the name on its own usually gives wider protection.',
      ],
    ],
  },
  'trademark-search': ASK(
    'Should I search logos too?',
    'Yes, where the logo has words or a distinctive design; device marks are searched by their elements.',
    {s: [['File', 'If the report looks clear, we can file your application.']]},
  ),
  'tm-objection': q(
    'What happens after the reply?',
    'The examiner accepts the mark, or fixes a hearing to discuss the objection.',
  ),
  'tm-renewal': ASK(
    'What if the mark is not used?',
    'A registered mark not used for five years can be removed on someone else’s application, so keep proof of use.',
    {
      out: ['A note of the next renewal date'],
      s: [['Next date', 'We note the next renewal date ten years ahead.']],
    },
  ),
  'tm-assignment': q(
    'Is stamp duty payable on the deed?',
    'Yes, at the rate the state sets for assignment deeds; we tell you the amount before it is signed.',
  ),
  'tm-watch': ASK(
    'Can you watch competitors too?',
    'Yes, we can include named competitors’ new filings in the watch.',
    {s: [['Act', 'If you decide to oppose, we file within the four-month window.']]},
  ),
  'well-known-tm': q('Is there a fee?', 'Yes, a government fee for the request, set by the Trade Marks Rules.'),
  'copyright-registration': q(
    'How long does registration take?',
    'Usually a few months, including a 30-day waiting period for objections.',
  ),
  'patent-search': ASK('How long does the search take?', 'Usually a week or two after we have the invention details.', {
    s: [['Decide', 'Use the report to decide whether, and how, to file.']],
  }),
  'provisional-patent': q(
    'Can I file abroad from a provisional?',
    'Yes, within 12 months, claiming the Indian filing date.',
  ),
  'tm-infringement': ASK(
    'Can I claim damages?',
    'A court can award damages or an account of profits, depending on the evidence.',
    {out: ['Advice on evidence to collect']},
  ),
  'copyright-infringement': ASK(
    'Can I get content taken down online?',
    'Platforms usually remove infringing content on a proper notice from the owner.',
    {out: ['Advice on evidence to collect']},
  ),
  'patent-infringement': ASK(
    'Can the patent be challenged in return?',
    'Often yes: the other side may ask for it to be revoked, so the patent’s strength is checked first.',
    {out: ['Advice on evidence to collect']},
  ),
  'legal-notice': {doc: ['Any earlier messages or reminders you sent']},
  agreements: {w: ['Landlords and tenants']},
  contracts: {w: ['Freelancers and agencies']},
  drafting: ASK('Can you draft in Hindi?', 'Yes, on request, where the document will be used in Hindi.', {
    w: ['Businesses needing board resolutions or letters'],
  }),
  affidavits: ASK(
    'Can I get it notarised online?',
    'Some states allow e-notarisation; most still need a visit to a notary.',
    {
      out: ['A soft copy for your records'],
    },
  ),
  pf: q(
    'Is PF needed for contract staff?',
    'Yes. The principal employer is responsible if the contractor does not pay.',
  ),
  esi: q(
    'What is the wage limit?',
    'ESI covers employees earning up to the limit the ESIC sets, currently ₹21,000 a month.',
  ),
  'professional-tax': ASK('Is it deductible?', 'Yes. Professional tax paid is deductible from salary income.', {
    out: ['A note of the yearly enrolment payment, where your state has one'],
  }),
  'shop-license': ASK('Is there a fee?', 'Most states charge a fee by the number of employees.', {
    out: ['Help with changes when you move or grow'],
  }),
  esop: {w: ['Founders planning a pool for future hires']},
  posh: ASK(
    'What if a complaint comes in?',
    'The committee inquires and recommends action within the times the Act sets; we can guide the committee.',
    {doc: ['Your current HR policies, if any']},
  ),
  'labour-compliance': ASK(
    'Can you handle several states?',
    'Yes, we follow each state’s rules for the staff working there.',
    {
      out: ['A monthly compliance status note', 'Registers kept up to date'],
      s: [['Report', 'A monthly note of what was paid and filed.']],
    },
  ),
  'family-lawyer': {doc: CONSULT_DOCS},
  'consumer-lawyer': {doc: ['Names of the seller and the platform used']},
  'labour-lawyer': {doc: ['Any notices or letters received']},
  'litigation-lawyer': {doc: ['Any notice or summons received']},
  'risk-advisory': ASK('Can it cover a single area?', 'Yes, for example only contracts or only data protection.', {
    s: [['Follow-up', 'We go through the report with you and answer questions.']],
  }),
  'talk-to-lawyer': ASK('Can I choose the lawyer?', 'We match you with a lawyer who handles your type of question.', {
    doc: CONSULT_DOCS,
  }),
  'talk-to-ca': {doc: ['Recent returns or notices, if the question is about them']},
  'talk-to-cs': {doc: ['Your company or LLP name and CIN']},
  'talk-to-ip-lawyer': {doc: ['The brand, logo or work you are asking about']},
  'consumer-complaint': ASK(
    'How long does a case take?',
    'The law aims for a decision within months, but busy commissions often take longer.',
    {w: ['Buyers of online orders that went wrong']},
  ),
  'online-complaint': q(
    'Should I tell my bank too?',
    'Yes, at once, so it can try to hold the money and start its own dispute process.',
  ),
  'family-immigration': {w: ['Spouses joining a partner working abroad']},
  'student-immigration': {w: ['Students switching from study to work visas']},
  'immigration-lawyer': {w: ['Employers sponsoring a foreign worker']},
  'pitch-deck': q('How many slides is right?', 'Usually ten to fifteen; we keep it as short as the story allows.'),
  'business-loan': q(
    'Can a new business get a loan?',
    'Some schemes and lenders finance new businesses, usually with a project report and the promoters’ own contribution.',
  ),
  dpr: q('How long does a DPR take?', 'Usually two to four weeks, depending on the project and the data you have.'),
};
