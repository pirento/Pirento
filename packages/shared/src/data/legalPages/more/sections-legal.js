// More "who it is for", "included", documents, steps, deliverables and questions for the IPR, Notices, Documents,
// Labour, Litigation and Consultation pages (w, i, doc, s, out, f), added after each page's own lines.
const LAWYER = {
  s: [['Next step', 'If you want the full work done, we quote the fee and start once you agree.']],
  out: ['A quote for the full matter, if you want one'],
};
const lawyer = (w, doc) => ({...LAWYER, w, ...(doc && {doc})});

const DISPUTE = {
  doc: ['Your registration or proof of ownership', 'Evidence of the copying: screenshots, samples, invoices'],
  s: [['Act', 'Send a notice, negotiate, or file a case, as you decide with the lawyer.']],
  out: ['A quote for the notice or the case'],
};

const NOTICE_OUT = ['A copy for your records, with the delivery tracking'];
const DRAFT_W = ['Founders formalising a deal they agreed on a call'];
const DRAFT_OUT = ['A short note of the key terms', 'One round of changes after your review'];

const CALL = {
  out: ['A short note of the advice, if you ask for it'],
};

const VISA = {
  out: ['A note of the timeline and next steps'],
  s: [['Prepare', 'Gather the documents on the checklist; we answer questions as you go.']],
};

export const MORE_SECTIONS_LEGAL = {
  'trademark-registration': {
    i: ['Replies to an examination report, where the package lists it'],
  },
  'trademark-search': {
    w: ['Founders naming a new product or company'],
    i: ['A list of the closest conflicting marks'],
    doc: ['The classes you plan to file in, if known'],
    out: ['Our view on registrability', 'A suggestion on classes to file in'],
  },
  'tm-objection': {
    w: ['Owners whose mark faces a section 9 or 11 objection', 'Applicants with a show cause hearing'],
    out: ['A note of the next step, such as a hearing date', 'Our view on the chances of acceptance'],
  },
  'tm-renewal': {
    w: ['Owners whose mark has just expired', 'Companies holding several marks'],
    i: ['A reminder for the next renewal'],
    out: ['A reminder for the next renewal date'],
  },
  'tm-assignment': {
    w: ['Companies after a merger or business sale'],
    i: ['Advice on stamp duty for the deed'],
    doc: ['The trademark registration or application details'],
    out: ['The registry record showing the new owner'],
  },
  'tm-watch': {
    w: ['Brands in crowded markets', 'Companies about to launch abroad or online'],
    i: ['A monthly summary of what was checked'],
    doc: ['Any marks you already know of that worry you', 'Who should receive the alerts'],
    out: ['Our view on whether to oppose', 'A quote to oppose, if you decide to'],
  },
  'well-known-tm': {
    w: ['Brands copied often across classes', 'Companies with long use and wide advertising'],
    i: ['Preparing the evidence and the request once you take the quote'],
    out: ['The registry’s decision once published', 'A note of what to do if it is refused'],
  },
  'copyright-registration': {
    i: ['Advice on who should be named as author and owner'],
    out: ['A note of how to use the registration'],
  },
  'patent-search': {
    w: ['Companies checking a product before launch'],
    i: ['A list of the closest prior art'],
    doc: ['Any earlier patents or papers you already know of'],
    out: ['Our view on patentability', 'Suggestions to strengthen the claims'],
  },
  'provisional-patent': {
    w: ['Researchers before publishing a paper'],
    i: ['Form 1 and Form 2 prepared for you'],
    out: ['A plan for the complete specification'],
  },
  'patent-registration': {
    w: ['Startups protecting a core product', 'Universities and research teams'],
    i: ['Drafting, filing and examination replies once you take the quote'],
    f: [
      [
        'What is the examination request?',
        'A request (Form 18) that must be filed within the time the rules set, or the application is treated as withdrawn.',
      ],
    ],
  },
  'tm-infringement': {w: ['Businesses that received a cease and desist notice'], ...DISPUTE},
  'copyright-infringement': {w: ['Creators whose content was copied online'], ...DISPUTE},
  'patent-infringement': {w: ['Companies that received an infringement notice'], ...DISPUTE},
  'legal-notice': {
    w: ['Businesses chasing a vendor or customer', 'Employees with unpaid dues'],
    out: NOTICE_OUT,
    f: [['Can I send it by email or WhatsApp?', 'Yes, alongside post; keep the delivery proof of each.']],
  },
  'money-recovery': {
    w: ['Freelancers with unpaid fees'],
    out: NOTICE_OUT,
  },
  'cheque-bounce': {
    w: ['Businesses paid by post-dated cheques', 'Lenders who received a cheque for repayment'],
    out: NOTICE_OUT,
    f: [
      [
        'Can the case be settled?',
        'Yes. A cheque bounce case can be settled at any stage, including through mediation or Lok Adalat.',
      ],
    ],
  },
  'consumer-notice': {
    w: ['Buyers with a refund refused', 'Customers of a service that was not delivered'],
    out: NOTICE_OUT,
  },
  'tenant-notice': {
    w: ['Landlords whose rent is unpaid'],
    out: NOTICE_OUT,
  },
  agreements: {w: DRAFT_W, out: DRAFT_OUT},
  contracts: {w: ['Startups signing their first customer'], out: DRAFT_OUT},
  drafting: {w: ['Businesses needing a letter, deed or declaration'], out: DRAFT_OUT},
  policies: {w: ['Startups before going live with payments'], out: DRAFT_OUT},
  affidavits: {
    w: ['People correcting a name or date of birth', 'Applicants needing a declaration for a government office'],
    i: ['A check of the facts against your documents'],
    out: ['Guidance on where to sign and notarise'],
    s: [['Use', 'Submit the signed and notarised affidavit where it was asked.']],
  },
  pf: {
    w: ['Businesses about to cross 20 employees'],
    out: ['A note of monthly due dates'],
  },
  esi: {
    w: ['Businesses about to cross 10 employees', 'Employers with staff below the ESI wage limit'],
    out: ['A note of monthly and half-yearly due dates'],
  },
  'professional-tax': {
    w: ['Businesses with staff in more than one state'],
    out: ['A note of payment and return due dates'],
  },
  'shop-license': {
    w: ['New offices and co-working teams', 'Businesses opening a bank account'],
    i: ['Guidance on what to display at the premises'],
    out: ['A note of renewal rules in your state'],
    s: [['Display', 'Keep the certificate at the premises and follow the Act’s working rules.']],
  },
  esop: {
    w: ['Companies before a funding round'],
    i: ['Drafting of the scheme and resolutions once you take the quote'],
    f: [
      [
        'Can an LLP give ESOPs?',
        'No. ESOPs under the Companies Act are for companies; LLPs use other profit-sharing plans.',
      ],
    ],
  },
  posh: {
    w: ['Startups growing past ten people', 'Companies with offices in several cities'],
    out: ['A note of the annual report due date'],
  },
  'labour-compliance': {
    w: ['Businesses with staff in several states', 'Companies without an HR compliance team'],
    i: ['Monthly payments, returns and registers once you take the quote'],
  },
  'labour-advisor': {...LAWYER, w: ['HR teams with a policy question']},
  'criminal-lawyer': lawyer(['Families of someone arrested', 'Businesses dealing with fraud or cheating']),
  'divorce-lawyer': lawyer([
    'Couples seeking a mutual consent divorce',
    'Spouses facing a maintenance or custody claim',
  ]),
  'family-lawyer': lawyer(['Heirs dividing property', 'Parents with a custody question']),
  'banking-lawyer': lawyer(['Account holders with a frozen or disputed account']),
  'consumer-lawyer': lawyer(['Homebuyers with delayed possession']),
  'labour-lawyer': lawyer(['Workers with unpaid wages or gratuity']),
  'litigation-lawyer': lawyer(['Anyone served with court papers', 'Businesses with contract disputes']),
  'ip-lawyer': lawyer(['Businesses licensing their IP', 'Startups facing a copying claim']),
  'trademark-lawyer': lawyer(['Businesses facing an opposition', 'Applicants with a refused mark']),
  tmt: lawyer(['Startups handling users’ personal data']),
  'risk-advisory': {
    w: ['Companies preparing for funding or an audit'],
    i: ['Review of contracts, licences, data and HR practices, as agreed'],
    out: ['A prioritised action list', 'A follow-up call to go through the report'],
  },
  'talk-to-lawyer': {w: ['Small businesses without in-house counsel'], ...CALL},
  'talk-to-ca': {w: ['Freelancers and professionals'], ...CALL},
  'talk-to-cs': {w: ['Startups before a funding round'], ...CALL},
  'talk-to-ip-lawyer': {w: ['Founders choosing a brand name', 'Creators worried about copying'], ...CALL},
  'consumer-complaint': {
    w: ['Homebuyers, patients and travellers with a service dispute'],
    i: ['Guidance for the hearings'],
    out: ['A copy of the complaint for your records', 'A note of the next hearing date'],
  },
  'online-complaint': {
    w: ['Businesses targeted by phishing or fake profiles'],
    i: ['A note to your bank to dispute the transaction'],
    out: ['A copy of the complaint and evidence list', 'A note of next steps with your bank'],
  },
  'corporate-immigration': {w: ['Startups relocating founders'], ...VISA},
  'family-immigration': {w: ['Parents visiting children abroad'], ...VISA},
  'student-immigration': {w: ['Students with an admission offer'], ...VISA},
  'immigration-lawyer': {w: ['Families with a dependant visa problem'], ...VISA},
  'pitch-deck': {
    w: ['Founders updating an old deck'],
    out: ['A short guide to presenting it', 'One round of changes after your review'],
  },
  'business-loan': {
    w: ['MSMEs applying under government schemes', 'Startups looking at their first loan'],
    out: ['A list of lenders or schemes that fit', 'Guidance on preparing the application'],
    s: [['Apply', 'You apply with the prepared documents; we answer the lender’s questions with you.']],
  },
  dpr: {
    w: ['Businesses expanding capacity'],
    i: ['Market, cost and financial sections, once you take the quote'],
    out: ['Projected financials in a spreadsheet', 'A summary for the lender'],
  },
};
