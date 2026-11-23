// Licenses & Registrations: the pages of the services not in featured.js.
import {NOT_INCLUDED, costs, pair, qa, step} from './common.js';

export const LICENCES = {
  'trade-license': {
    page: {
      intro:
        'A trade licence is the permission your city or local body gives to run a business at a particular place. The rules, fees and process are set by each municipal corporation or panchayat.\nWe check what your local body needs and apply for you.',
      whoFor: [
        'Shops, restaurants and offices',
        'Small factories and workshops',
        'Anyone opening new business premises',
      ],
      included: ['Check of your local body’s requirements', 'Application filed and followed up'],
      notIncluded: [NOT_INCLUDED.gov, 'Fire, pollution or other separate approvals', 'Renewals in later years'],
      documents: [
        'ID proof and photo of the owner',
        'Proof of the business premises (ownership papers or rent agreement)',
        'The owner’s NOC, if the place is rented',
        'Business registration documents, where you have them',
      ],
      steps: [
        step('Check', 'We confirm the category and documents your local body asks for.'),
        step('Apply', 'We prepare and file the application.'),
        step('Inspection', 'An official may visit the premises.'),
        step('Licence issued', 'You receive the trade licence.'),
      ],
      timeline: ['Your local body’s processing time', 'Whether an inspection is needed'],
      costs: costs({gov: true}),
      deliverables: ['The trade licence', 'Its renewal date'],
      mistakes: ['Applying for the wrong trade category', 'Premises documents in a different name'],
      benefits: [pair('Run without disruption', 'Avoid penalties or sealing for trading without a licence.')],
      faqs: [qa('Does it need renewal?', 'Yes, usually every year, as your local body sets.')],
    },
  },

  iso: {
    page: {
      intro:
        'ISO certification shows that your business follows an international standard, most often ISO 9001 for quality management. The certificate is issued by an independent certification body after an audit.\nWe help you prepare the documents and coordinate with a certification body.',
      whoFor: [
        'Businesses bidding for tenders',
        'Exporters and suppliers to large companies',
        'Firms improving their processes',
      ],
      included: [
        'Help choosing the right standard',
        'Preparation of the policies and records the audit looks at',
        'Coordination with a certification body',
      ],
      notIncluded: ['The certification body’s audit and certificate fees', 'Surveillance audits in later years'],
      documents: [
        'Business registration documents',
        'A description of your products or services and processes',
        'Details of the premises and staff',
      ],
      steps: [
        step('Scope', 'Choose the standard and what the certificate will cover.'),
        step('Prepare', 'We help put the required policies and records in place.'),
        step('Audit', 'The certification body audits your business.'),
        step('Certificate', 'The body issues the ISO certificate.'),
      ],
      timeline: ['How ready your processes and records are', 'The certification body’s audit dates'],
      costs: costs({
        extra: [
          pair('Certification body', 'Its audit and certificate fees are paid to it and confirmed with you first.'),
        ],
      }),
      deliverables: ['ISO certificate from the certification body', 'The documents prepared for the audit'],
      mistakes: [
        'Choosing a certification body that is not accredited',
        'Treating the certificate as a one-time task and missing surveillance audits',
      ],
      benefits: [pair('Win more work', 'Many tenders and buyers ask for an ISO certificate.')],
      faqs: [
        qa('Who issues ISO certificates?', 'Independent certification bodies, not ISO itself.'),
        qa('How long is it valid?', 'Usually three years, with yearly surveillance audits.'),
      ],
    },
  },

  bis: {
    page: {
      intro:
        'BIS certification lets you use the ISI mark, or register a product, under the Bureau of Indian Standards Act, 2016. For products covered by a quality control order it is required before you sell them in India.\nWe check which scheme applies to your product and guide the application, testing and inspection.',
      whoFor: [
        'Manufacturers of products covered by Indian standards',
        'Importers of such products',
        'Makers of electronics under the registration scheme',
      ],
      included: [
        'Check of the scheme and standard for your product',
        'Application on the BIS portal',
        'Coordination of testing and inspection',
      ],
      notIncluded: ['BIS fees and lab testing charges', 'Changes needed to the product or factory'],
      documents: [
        'Business and factory registration documents',
        'Details of the product, its brand and its Indian standard',
        'Factory layout, machinery and testing equipment details',
        'Test reports from a BIS-recognised lab, where needed',
      ],
      steps: [
        step('Check', 'We confirm the scheme and standard for your product.'),
        step('Test', 'Samples are tested in a recognised lab.'),
        step('Apply and inspect', 'We file the application; BIS may inspect the factory.'),
        step('Licence', 'BIS grants the licence or registration.'),
      ],
      timeline: ['Lab testing time', 'Factory inspection and BIS review'],
      costs: costs({gov: true, extra: [pair('Lab testing', 'Charged by the recognised lab for your samples.')]}),
      deliverables: ['BIS licence or registration', 'A note of the marking and renewal rules'],
      mistakes: ['Testing against the wrong standard', 'Selling a covered product before the licence is granted'],
      benefits: [pair('Sell legally', 'Required for products under a quality control order.')],
      faqs: [qa('Is BIS mandatory for my product?', 'Only for products the government has notified. We check yours.')],
    },
  },

  hallmark: {
    page: {
      intro:
        'Jewellers who sell hallmarked gold or silver jewellery must register with the Bureau of Indian Standards. Hallmarking shows the purity of the metal, and each hallmarked gold piece carries a unique ID (HUID).\nWe handle your BIS registration as a jeweller.',
      whoFor: ['Jewellers and jewellery retailers', 'Wholesalers and manufacturers of jewellery'],
      included: ['BIS jeweller registration application', 'Follow-up until registration'],
      notIncluded: ['BIS fees', 'Hallmarking charges at assaying centres'],
      documents: [
        'Business registration and GST documents',
        'ID and address proof of the owner',
        'Address of the shop or premises',
      ],
      steps: [
        step('Prepare', 'We collect your business details.'),
        step('Apply', 'We file the registration on the BIS portal.'),
        step('Registration', 'BIS grants the jeweller registration.'),
      ],
      timeline: ['BIS processing time'],
      costs: costs({gov: true}),
      deliverables: ['BIS registration certificate for the jeweller'],
      mistakes: ['Selling unhallmarked gold jewellery where hallmarking is mandatory'],
      benefits: [pair('Customer trust', 'Hallmarking proves purity to buyers.')],
      faqs: [qa('Is hallmarking mandatory?', 'For gold jewellery in the districts the government has notified, yes.')],
    },
  },

  dsc: {
    page: {
      intro:
        'A digital signature certificate (DSC) lets you sign documents online, and is needed for company and LLP filings with the MCA, income tax and GST filings in some cases, and e-tenders. It is issued by a licensed certifying authority after verifying you.\nWe arrange a Class 3 DSC for you.',
      whoFor: ['Company directors and LLP partners', 'Anyone filing on government portals', 'Bidders on e-tenders'],
      included: ['Class 3 DSC application', 'Help with the online verification'],
      notIncluded: ['A USB token, if you need a new one and it is not listed in the package'],
      documents: ['PAN', 'Aadhaar or other address proof', 'A recent photo', 'Email and mobile number'],
      steps: [
        step('Apply', 'We start the application with a certifying authority.'),
        step('Verify', 'You complete the video or Aadhaar verification.'),
        step('Issued', 'The DSC is issued, usually on a USB token.'),
      ],
      timeline: ['How quickly you complete the verification'],
      costs: costs(),
      deliverables: ['Class 3 DSC', 'Its validity date'],
      mistakes: ['A name on the DSC that does not match the PAN', 'Letting it expire before a filing is due'],
      benefits: [pair('Sign online', 'File and sign without paper.')],
      faqs: [qa('How long is a DSC valid?', 'One to three years, depending on what you choose.')],
    },
  },
};
