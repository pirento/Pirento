// Business Setup & Registration: the pages of the services not in featured.js.
import {NOT_INCLUDED, costs, pair, qa, step} from './common.js';

export const SETUP = {
  'sole-proprietorship': {
    page: {
      intro:
        'A sole proprietorship is the simplest way to run a business on your own. India has no single law that registers it: the business is set up through the registrations it needs, such as Udyam, GST or a shop licence, and a current account in its name.\nWe work out which registrations fit your business and file them for you.',
      whoFor: ['Freelancers and consultants', 'Small shops and traders', 'Anyone testing a business idea alone'],
      included: [
        'Advice on which registrations your business needs',
        'Filing of the agreed registrations (such as Udyam, GST or a shop licence)',
        'Help with the documents a bank asks for to open a current account',
      ],
      notIncluded: [NOT_INCLUDED.gov, 'Registrations outside the agreed list', 'Accounting and tax returns'],
      documents: [
        'PAN and Aadhaar of the owner',
        'A recent photo',
        'Proof of the business address (utility bill, and rent agreement or NOC)',
        'Bank details',
      ],
      steps: [
        step('Tell us about the business', 'What you do, where, and your expected turnover.'),
        step('Pick the registrations', 'We confirm which ones you need and why.'),
        step('We file', 'Each registration is filed and followed up.'),
        step('Certificates', 'You receive each certificate as it is issued.'),
      ],
      timeline: ['How many registrations you need', 'Officer verification, where an authority does one'],
      costs: costs({gov: true}),
      deliverables: ['The certificate of each registration filed', 'A note of the yearly filings each one needs'],
      mistakes: [
        'Using an address you cannot prove with documents',
        'Mixing personal and business money in one account',
      ],
      benefits: [
        pair('Quick to start', 'Few formalities, so you can begin trading soon.'),
        pair('Full control', 'You make every decision yourself.'),
      ],
      faqs: [
        qa(
          'Is a proprietorship a separate legal person?',
          'No. The owner and the business are the same in law, so the owner is personally liable for its debts.',
        ),
        qa(
          'Can I convert it later?',
          'Yes. Many owners move to an LLP or a private limited company as the business grows.',
        ),
      ],
    },
  },

  'partnership-firm': {
    page: {
      intro:
        'A partnership firm is two or more people running a business together under a partnership deed. Registering the firm with the Registrar of Firms is optional under the Indian Partnership Act, 1932, but an unregistered firm cannot sue others to enforce its contracts, so most firms register.\nWe draft the deed with you and handle the registration.',
      whoFor: ['Family businesses', 'Two or more people starting a small business', 'Traders and service firms'],
      included: [
        'Partnership deed drafted from what the partners agree',
        'Registration with the Registrar of Firms of your state',
        'Help applying for the firm’s PAN',
      ],
      notIncluded: [NOT_INCLUDED.gov, 'GST and other registrations', 'Accounting and tax returns'],
      documents: [
        'PAN and Aadhaar of every partner',
        'A recent photo of each partner',
        'Proof of the firm’s address (utility bill, and rent agreement or NOC)',
        'The capital each partner brings and how profits are shared',
      ],
      steps: [
        step('Agree the terms', 'Partners, capital, profit share, roles and exit rules.'),
        step('Deed', 'We draft the deed; it is printed on stamp paper and signed.'),
        step('Registration', 'We file with the Registrar of Firms.'),
        step('Firm registered', 'You receive the registration certificate.'),
      ],
      timeline: ['Stamp paper and notary steps in your state', 'The Registrar’s processing time'],
      costs: costs({gov: true, govNote: 'Stamp duty on the deed and the Registrar’s fee, which differ by state.'}),
      deliverables: ['Signed partnership deed', 'Registration certificate of the firm', 'PAN of the firm'],
      mistakes: [
        'Leaving out what happens when a partner leaves or dies',
        'Profit shares in the deed that differ from what partners actually agreed',
      ],
      benefits: [
        pair('Easy to form', 'Fewer filings than a company or an LLP.'),
        pair('Shared skills and money', 'Partners bring capital and work together.'),
      ],
      faqs: [
        qa('How many partners can a firm have?', 'At least two. The law caps the number for firms in business.'),
        qa(
          'Are partners liable for the firm’s debts?',
          'Yes. In a partnership firm, partners are personally liable. An LLP limits that.',
        ),
      ],
    },
  },

  'nidhi-company': {
    page: {
      intro:
        'A Nidhi company is a public company formed to encourage saving among its members: it takes deposits from and lends only to its members. It is governed by the Companies Act, 2013 and the Nidhi Rules, 2014.\nWe incorporate the company and explain the rules it must meet in its first year.',
      whoFor: ['Groups that want a member-only savings and lending body'],
      included: [
        'Name approval and incorporation with the Registrar of Companies',
        'MOA and AOA drafted for a Nidhi company',
        'Company PAN and TAN',
      ],
      notIncluded: [
        NOT_INCLUDED.gov,
        'The Nidhi declaration filings due after incorporation',
        'Accounting, audit and annual filings',
      ],
      documents: [
        'PAN and Aadhaar of every director and member',
        'A recent photo of each director',
        'Address proof of each director',
        'Registered office proof: a utility bill, and the owner’s NOC or rent agreement',
      ],
      steps: [
        step('Plan', 'Members, directors and capital, against the Nidhi Rules.'),
        step('Signatures and name', 'Digital signatures and the name application.'),
        step('Incorporation', 'We file the incorporation forms.'),
        step('Incorporated', 'You receive the certificate, PAN and TAN.'),
      ],
      timeline: ['Name approval', 'The Registrar’s review of the incorporation forms'],
      costs: costs({gov: true}),
      deliverables: ['Certificate of incorporation', 'MOA and AOA', 'A list of the first-year Nidhi requirements'],
      mistakes: [
        'Starting without enough members and capital to meet the Nidhi Rules',
        'Taking deposits from people who are not members',
      ],
      benefits: [
        pair('Member-owned', 'Savings and loans stay within the members.'),
        pair('A recognised structure', 'Set up and run under specific rules.'),
      ],
      faqs: [
        qa(
          'How many people do we need?',
          'At least seven members and three directors to start; the Nidhi Rules then set minimum members and net owned funds to reach within the first year.',
        ),
        qa('Can a Nidhi lend to anyone?', 'No. It deals only with its members.'),
      ],
    },
  },

  'producer-company': {
    page: {
      intro:
        'A producer company lets farmers and other primary producers own a company together, to buy inputs, process and sell their produce. It is formed under the Companies Act, 2013.\nWe incorporate it and set up its first documents.',
      whoFor: ['Farmers and farmer groups', 'Producer organisations (FPOs)', 'Artisans and primary producers'],
      included: [
        'Name approval and incorporation with the Registrar of Companies',
        'MOA and AOA drafted for a producer company',
        'Company PAN and TAN',
      ],
      notIncluded: [NOT_INCLUDED.gov, 'Government scheme applications', 'Accounting, audit and annual filings'],
      documents: [
        'PAN and Aadhaar of every member and director',
        'Proof that members are producers (for example land or produce records)',
        'A recent photo of each director',
        'Registered office proof',
      ],
      steps: [
        step('Plan', 'Members, directors and the produce the company will deal in.'),
        step('Signatures and name', 'Digital signatures and the name application.'),
        step('Incorporation', 'We file the incorporation forms.'),
        step('Incorporated', 'You receive the certificate, PAN and TAN.'),
      ],
      timeline: ['Collecting documents from many members', 'The Registrar’s review'],
      costs: costs({gov: true}),
      deliverables: ['Certificate of incorporation', 'MOA and AOA', 'PAN and TAN'],
      mistakes: ['Members whose producer status cannot be shown', 'Missing documents from a few members'],
      benefits: [
        pair('Bargaining power', 'Producers buy and sell together.'),
        pair('Limited liability', 'Members’ liability is limited to their shares.'),
      ],
      faqs: [
        qa(
          'Who can form one?',
          'At least ten individual producers, or two producer institutions, or a mix; the company needs at least five directors.',
        ),
      ],
    },
  },

  'startup-india-registration': {
    page: {
      intro:
        'Startup India recognition from DPIIT marks your business as a recognised startup, which opens up certain government benefits. It is for innovative private limited companies, LLPs and registered partnership firms.\nWe check that you qualify, prepare the application and file it.',
      whoFor: ['Young companies and LLPs with an innovative product or service'],
      included: ['Eligibility check', 'Application and write-up on the Startup India portal', 'Follow-up on queries'],
      notIncluded: [
        'The separate application for the income tax exemption (80-IAC)',
        'Funding, grants or scheme applications',
      ],
      documents: [
        'Certificate of incorporation or registration',
        'PAN of the entity',
        'Details of the directors or partners',
        'A short description of what is innovative about the business, with any website, deck or patent',
      ],
      steps: [
        step('Eligibility', 'We check age, turnover and structure.'),
        step('Write-up', 'We prepare the description of your innovation.'),
        step('Application', 'We file on the Startup India portal.'),
        step('Recognition', 'You receive the DPIIT recognition certificate.'),
      ],
      timeline: ['How clearly the innovation is shown', 'Queries from DPIIT'],
      costs: costs(),
      deliverables: ['DPIIT recognition certificate', 'A note of the benefits it makes you eligible for'],
      mistakes: [
        'Describing an ordinary business as innovative',
        'Applying after the entity has crossed the age limit',
      ],
      benefits: [
        pair('Easier compliance', 'Self-certification under some labour and environment laws.'),
        pair('IP support', 'Lower fees for patent and trademark filings.'),
        pair('Tax benefit', 'Eligibility to apply for a three-year income tax exemption.'),
      ],
      faqs: [
        qa(
          'Who qualifies?',
          'Generally a private limited company, LLP or registered partnership up to 10 years old, with turnover under ₹100 crore in every year, working on innovation or improvement. We check your case.',
        ),
        qa('Does recognition give a tax exemption by itself?', 'No. The exemption needs a separate approval.'),
      ],
    },
  },
};
