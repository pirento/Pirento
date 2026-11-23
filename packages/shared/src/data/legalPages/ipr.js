// Intellectual property: the pages of the services not in featured.js.
import {costs, pair, qa, step} from './common.js';

const gov =
  'Official fees of the IP office, which depend on the applicant and the classes or claims. We confirm the amount before filing.';
const tmDocs = [
  'Trademark application or registration number',
  'Applicant’s name and address',
  'Power of attorney signed in our favour (we prepare it)',
];

// Infringement work starts with a paid consultation; the action itself is quoted after it.
const infringement = (what, law) => ({
  page: {
    intro: `If someone is copying your ${what}, the law gives you remedies, from a legal notice to a suit for an injunction and damages under the ${law}.\nThis starts with a paid consultation with a lawyer, who reviews your rights and the evidence and suggests the next step. The action itself is quoted after it.`,
    whoFor: [`Owners whose ${what} is being copied`, `Anyone accused of infringing someone’s ${what}`],
    included: ['A consultation with a lawyer', 'A view on your rights and options', 'A quote for the next step'],
    notIncluded: ['Notices, suits and court fees, quoted after the consultation'],
    documents: [
      `Proof of your ${what} (registration, or proof of creation and use)`,
      'Evidence of the copying (photos, links, invoices)',
      'Any letters already exchanged',
    ],
    steps: [
      step('Consultation', 'A lawyer reviews your rights and evidence.'),
      step('Options', 'Notice, negotiation or a suit, with what each involves.'),
      step('Quote', 'The chosen action is quoted.'),
    ],
    timeline: ['How quickly evidence is collected', 'The route chosen; court cases take time'],
    costs: costs({extra: [pair('Action', 'A notice or suit is quoted after the consultation; court fees are extra.')]}),
    deliverables: ['A lawyer’s view on your case and next steps'],
    mistakes: ['Waiting too long after finding the copying', 'Posting accusations publicly before taking advice'],
    benefits: [pair('Act early', 'Early action can stop the copying sooner.')],
    faqs: [qa('Can you promise the outcome?', 'No. A lawyer advises on the facts; courts and the other side decide.')],
  },
});

export const IPR = {
  'trademark-search': {
    page: {
      intro:
        'A trademark search checks the Trade Marks Registry for marks that are the same as or similar to yours in the same class, before you file or launch.\nWe search and give you a written report.',
      whoFor: ['Anyone choosing a brand name', 'Before filing a trademark application'],
      included: ['Search of registered and pending marks in your class', 'A written report with the risk we see'],
      notIncluded: ['The trademark application (see Trademark Registration)'],
      documents: ['The brand name or logo', 'The goods or services it is used for'],
      steps: [
        step('Share the mark', 'Name or logo and what it is for.'),
        step('Search', 'We search the registry.'),
        step('Report', 'You receive the similar marks found and our view.'),
      ],
      timeline: ['The number of classes searched'],
      costs: costs(),
      deliverables: ['Written trademark search report'],
      mistakes: ['Launching a brand before searching', 'Searching only the exact spelling'],
      benefits: [pair('Avoid objections', 'Find clashes before you spend on a brand.')],
      faqs: [
        qa(
          'Does a clear search guarantee registration?',
          'No. It lowers the risk; the registry still examines the application.',
        ),
      ],
    },
  },

  'tm-objection': {
    page: {
      intro:
        'If the registry raises an objection in its examination report, the application moves forward only after a reply within the time given, usually 30 days. A hearing may follow.\nWe draft and file the reply.',
      whoFor: ['Applicants whose trademark application got an examination report'],
      included: [
        'Review of the examination report',
        'A drafted reply with arguments and case support',
        'Filing the reply',
      ],
      notIncluded: ['Attending a hearing, unless the package lists it', 'Opposition proceedings'],
      documents: [...tmDocs, 'The examination report', 'Proof of use of the mark, if any'],
      steps: [
        step('Review', 'We study the objection.'),
        step('Draft', 'We draft the reply.'),
        step('File', 'We file it before the deadline.'),
        step('Next', 'The registry accepts it or fixes a hearing.'),
      ],
      timeline: ['The reply deadline', 'The registry’s review and any hearing'],
      costs: costs(),
      deliverables: ['Filed reply with acknowledgement'],
      mistakes: ['Missing the reply deadline, which can lead to the application being abandoned'],
      benefits: [pair('Keep your application alive', 'A timely reply keeps it moving.')],
      faqs: [qa('What if a hearing is fixed?', 'A lawyer can attend; it is quoted separately unless included.')],
    },
  },

  'tm-renewal': {
    page: {
      intro:
        'A registered trademark lasts 10 years and can be renewed again and again for 10 years at a time. Renewal can be filed in the six months before expiry; a late renewal with an extra fee is possible for a limited time after.\nWe file the renewal.',
      whoFor: ['Owners of trademarks nearing their 10-year expiry'],
      included: ['Renewal application (TM-R)', 'Follow-up until renewal is recorded'],
      notIncluded: ['Official renewal and late fees'],
      documents: [...tmDocs, 'The registration certificate'],
      steps: [
        step('Check dates', 'We confirm the expiry and fees.'),
        step('File', 'We file the renewal.'),
        step('Recorded', 'The registry records the renewal.'),
      ],
      timeline: ['How close to expiry you are'],
      costs: costs({gov: true, govNote: gov}),
      deliverables: ['Filed renewal and the renewal record'],
      mistakes: ['Letting the mark lapse, which can lead to removal from the register'],
      benefits: [pair('Keep your rights', 'Protection continues for 10 more years.')],
      faqs: [qa('How often do I renew?', 'Every 10 years.')],
    },
  },

  'tm-assignment': {
    page: {
      intro:
        'When a trademark is sold or transferred, an assignment deed records it, and the new owner asks the registry to record the change.\nWe draft the deed and file the request.',
      whoFor: ['Buyers and sellers of a brand', 'Founders moving a mark into their company'],
      included: ['Assignment deed', 'Request to record the new owner (TM-P)'],
      notIncluded: ['Official fees and stamp duty on the deed'],
      documents: [...tmDocs, 'Details of the buyer and seller', 'The price or terms agreed'],
      steps: [
        step('Terms', 'Agree what is transferred and on what terms.'),
        step('Deed', 'We draft the deed; both sides sign.'),
        step('File', 'We file the request with the registry.'),
        step('Recorded', 'The new owner is recorded.'),
      ],
      timeline: ['Stamp duty and signatures', 'The registry’s processing'],
      costs: costs({gov: true, govNote: gov}),
      deliverables: ['Signed assignment deed', 'Filed request with acknowledgement'],
      mistakes: ['Not recording the assignment with the registry'],
      benefits: [pair('Clear ownership', 'The register shows who owns the brand.')],
      faqs: [qa('Can a pending application be assigned?', 'Yes, applications can be assigned too.')],
    },
  },

  'tm-watch': {
    page: {
      intro:
        'New trademark applications are published in the Trade Marks Journal, and anyone may oppose a mark within four months of publication. A watch service checks the Journal for marks similar to yours, so you can act in time.',
      whoFor: ['Owners of registered or pending trademarks'],
      included: ['Regular checks of the Trade Marks Journal for similar marks', 'Alerts with our view on each'],
      notIncluded: ['Filing oppositions, which are quoted separately'],
      documents: ['Your trademark details and classes'],
      steps: [
        step('Set up', 'We note your marks and classes.'),
        step('Watch', 'We check each Journal.'),
        step('Alert', 'You hear about similar marks with time to oppose.'),
      ],
      timeline: ['Runs for the year bought'],
      costs: costs(),
      deliverables: ['Alerts on similar marks found'],
      mistakes: ['Finding out about a copycat mark after the opposition window closes'],
      benefits: [pair('Act in time', 'Oppose similar marks within the four-month window.')],
      faqs: [qa('Do you oppose marks for me?', 'If you choose to; it is quoted separately.')],
    },
  },

  'well-known-tm': {
    page: {
      intro:
        'A well-known trademark gets wider protection, across all classes, against marks that would take advantage of its reputation. The owner asks the registry to declare it well known, with evidence of its reputation.\nThis starts with a paid consultation; we then quote the application.',
      whoFor: ['Brands with a strong reputation across India'],
      included: ['A consultation on whether your evidence is strong enough', 'A quote for the application'],
      notIncluded: ['Official fees, which are significant for this request'],
      documents: [
        'Trademark registrations',
        'Evidence of sales, advertising and reputation over the years',
        'Court orders recognising the mark, if any',
      ],
      steps: [
        step('Consultation', 'We review your evidence.'),
        step('Quote', 'We quote the application.'),
        step('Prepare', 'We put the evidence together.'),
        step('File', 'We file the request with the registry.'),
      ],
      timeline: ['Collecting evidence', 'The registry’s review'],
      costs: costs({gov: true, govNote: gov, extra: [pair('Application', 'Quoted after the consultation.')]}),
      deliverables: ['Filed request with the evidence'],
      mistakes: ['Applying without strong evidence of reputation'],
      benefits: [pair('Wider protection', 'Protection across classes, not just your own.')],
      faqs: [
        qa(
          'Is it granted to most brands?',
          'No. It needs strong evidence of reputation; we tell you honestly if yours is not ready.',
        ),
      ],
    },
  },

  'copyright-registration': {
    page: {
      intro:
        'Copyright protects original works such as writing, art, music, films and software. It exists from creation, but registering it with the Copyright Office gives you strong evidence of ownership.\nWe prepare and file the application.',
      whoFor: ['Authors, artists and musicians', 'Software developers', 'Businesses with original designs or content'],
      included: ['Application to the Copyright Office', 'Replies to objections, if any are raised'],
      notIncluded: ['Official fees', 'Hearings, unless the package lists them'],
      documents: [
        'A copy of the work',
        'Author’s and owner’s details',
        'A no-objection letter from others involved, where needed',
        'Power of attorney (we prepare it)',
      ],
      steps: [
        step('Share the work', 'Upload the work and details.'),
        step('File', 'We file the application.'),
        step('Waiting period', 'There is a 30-day period for objections.'),
        step('Registered', 'The Copyright Office issues the registration.'),
      ],
      timeline: ['The 30-day objection period', 'The office’s examination'],
      costs: costs({gov: true, govNote: gov}),
      deliverables: ['Filed application with diary number', 'Registration certificate once issued'],
      mistakes: ['Not having rights from co-creators or commissioned work in writing'],
      benefits: [pair('Proof of ownership', 'Registration is evidence in a dispute.')],
      faqs: [qa('Is copyright registration compulsory?', 'No, but it helps prove ownership.')],
    },
  },

  'patent-search': {
    page: {
      intro:
        'A patent search looks for earlier patents and publications (prior art) close to your invention, to see whether it is likely to be new and inventive before you spend on filing.',
      whoFor: ['Inventors and startups', 'Before filing a patent application'],
      included: ['Search of patent and other databases for prior art', 'A written report with our view on novelty'],
      notIncluded: ['Drafting or filing a patent application'],
      documents: ['A description of the invention, with drawings if any', 'What you believe is new about it'],
      steps: [
        step('Share the invention', 'Description and drawings, under confidentiality.'),
        step('Search', 'We search for prior art.'),
        step('Report', 'You receive what we found and our view.'),
      ],
      timeline: ['How complex the technology is'],
      costs: costs(),
      deliverables: ['Written patent search report'],
      mistakes: ['Publishing or selling the invention before filing'],
      benefits: [pair('Decide wisely', 'Know the chances before spending on a patent.')],
      faqs: [
        qa(
          'Is my invention kept confidential?',
          'Yes. Share it with us under confidentiality; do not publish it before filing.',
        ),
      ],
    },
  },

  'provisional-patent': {
    page: {
      intro:
        'A provisional patent application secures a priority date for your invention while you develop it further. The complete specification must follow within 12 months, or the provisional lapses.\nWe draft and file the provisional application.',
      whoFor: ['Inventors still developing the invention', 'Startups that want an early filing date'],
      included: ['Drafting of the provisional specification', 'Filing with the Patent Office'],
      notIncluded: ['Official fees', 'The complete specification (see Patent Registration)'],
      documents: [
        'A detailed description of the invention',
        'Drawings or diagrams',
        'Inventors’ and applicant’s details',
      ],
      steps: [
        step('Understand', 'We study the invention with you.'),
        step('Draft', 'We draft the provisional specification.'),
        step('File', 'We file it and you get the priority date.'),
        step('Next 12 months', 'The complete specification must follow in time.'),
      ],
      timeline: ['How detailed the invention description is'],
      costs: costs({gov: true, govNote: gov}),
      deliverables: ['Filed provisional application with its number and date', 'A reminder of the 12-month deadline'],
      mistakes: ['Missing the 12-month deadline for the complete specification'],
      benefits: [pair('Early date', 'Your filing date counts against later filers.')],
      faqs: [
        qa(
          'Does a provisional give a patent?',
          'No. It secures the date; the patent needs a complete specification and examination.',
        ),
      ],
    },
  },

  'patent-registration': {
    page: {
      intro:
        'Getting a patent means filing a complete specification with claims, requesting examination, replying to the examiner’s objections, and getting it granted. A granted patent gives exclusive rights for 20 years from filing.\nThis starts with a paid consultation; we then quote the work.',
      whoFor: ['Inventors and companies with a new, inventive and useful invention'],
      included: ['A consultation on the invention and the route', 'A quote for drafting and prosecution'],
      notIncluded: ['Official fees', 'Foreign filings'],
      documents: [
        'Invention description, drawings and test data',
        'Any provisional application filed',
        'Inventors’ and applicant’s details',
      ],
      steps: [
        step('Consultation', 'We review the invention and searches.'),
        step('Draft', 'We draft the complete specification and claims.'),
        step('Examination', 'We request examination and reply to objections.'),
        step('Grant', 'The patent is granted when the examiner is satisfied.'),
      ],
      timeline: ['The Patent Office’s examination queue', 'Objections and hearings'],
      costs: costs({
        gov: true,
        govNote: gov,
        extra: [pair('Drafting and prosecution', 'Quoted after the consultation.')],
      }),
      deliverables: [
        'Filed complete specification',
        'Replies to the examination report',
        'Patent certificate, if granted',
      ],
      mistakes: ['Claims that are too broad or too narrow', 'Missing the examination request deadline'],
      benefits: [pair('Exclusive rights', 'Stop others using your invention for 20 years.')],
      faqs: [qa('How long does it take?', 'Usually years, depending on the examination queue and objections.')],
    },
  },

  'tm-infringement': infringement('trademark', 'Trade Marks Act, 1999'),
  'copyright-infringement': infringement('copyright work', 'Copyright Act, 1957'),
  'patent-infringement': infringement('patented invention', 'Patents Act, 1970'),
};
