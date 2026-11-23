// The ten main Legal services, with their packages (prices in rupees, cheapest first) and full page sections.
// Admin → Services & prices can change every part; a service not listed here shows its single price and the
// sections admin writes for it. Facts are general rules of Indian law; anything that depends on the case says so.

import {NOT_INCLUDED, costs} from './common.js';

const ROC = 'Filed with the Registrar of Companies through the MCA portal';

export const FEATURED = {
  'private-limited-company': {
    packages: [
      {
        id: 'basic',
        name: 'Basic',
        price: 1999,
        deliveryTime: '7-10 days',
        includes: [
          'Name check and approval',
          'Digital signatures (DSC) for 2 directors',
          'Director identification numbers (DIN)',
          'MOA and AOA drafted',
          'Certificate of incorporation with company PAN and TAN',
        ],
      },
      {
        id: 'standard',
        name: 'Standard',
        price: 4999,
        deliveryTime: '10-14 days',
        recommended: true,
        includes: [
          'Everything in Basic',
          'GST registration',
          'Help opening the company bank account',
          'Share certificates for the first shareholders',
        ],
      },
      {
        id: 'premium',
        name: 'Premium',
        price: 9999,
        deliveryTime: '15-20 days',
        includes: [
          'Everything in Standard',
          'Commencement of business filing (INC-20A)',
          'First auditor appointment (ADT-1)',
          'A call with a company secretary for your first-year plan',
        ],
      },
    ],
    page: {
      intro:
        'A private limited company is the most common way to start a business with partners or investors in India. It is a separate legal person, its shareholders’ liability is limited to their shares, and it can raise money by issuing new shares.\nWe prepare and file everything for you, ' +
        'and keep you updated at each step in your dashboard.',
      whoFor: [
        'Founders starting with one or more partners',
        'Businesses that plan to raise investment',
        'Anyone who wants limited liability and a separate legal identity',
      ],
      included: [
        ROC,
        'Drafting of the MOA (what the company does) and AOA (its rules)',
        'PAN and TAN for the company with the incorporation certificate',
      ],
      documents: [
        'PAN card of every director and shareholder',
        'Aadhaar of every director and shareholder',
        'A recent passport-size photo of each director',
        'Address proof of each director (bank statement or utility bill, not older than 2 months)',
        'Registered office proof: a utility bill, and the owner’s NOC or the rent agreement',
      ],
      notIncluded: [
        NOT_INCLUDED.gov,
        'Bookkeeping, audit and annual ROC filings',
        'Trademark and licences, unless the package lists them',
      ],
      timeline: [
        'Name approval, which may need a second choice',
        'Collecting documents from every director',
        'Queries from the Registrar',
      ],
      costs: costs({
        gov: true,
        govNote:
          'Registration fees and stamp duty on the MOA and AOA, which depend on your state and capital. We confirm the amount before filing.',
      }),
      deliverables: [
        'Certificate of incorporation with CIN',
        'Company PAN and TAN',
        'MOA and AOA',
        'A list of first-year compliance steps',
      ],
      mistakes: [
        'A name too close to an existing company or trademark',
        'An address proof older than two months',
        'Names that differ between PAN and Aadhaar',
      ],
      steps: [
        {title: 'Tell us about your company', body: 'Proposed names, directors, shareholding and the business.'},
        {title: 'Signatures and name', body: 'We get digital signatures and apply for your company name.'},
        {title: 'Drafting and filing', body: 'We draft the MOA and AOA and file the incorporation form with the ROC.'},
        {title: 'Company incorporated', body: 'You get the certificate of incorporation, with the PAN and TAN.'},
      ],
      benefits: [
        {title: 'Limited liability', body: 'Shareholders risk only what they put into the company.'},
        {title: 'Easier to raise money', body: 'New shares can be issued to investors.'},
        {title: 'Separate legal identity', body: 'The company owns property and signs contracts in its own name.'},
      ],
      faqs: [
        {
          q: 'How many people do I need?',
          a: 'At least two directors and two shareholders (the same people can be both). At least one director must be resident in India.',
        },
        {
          q: 'Can I use my home as the registered office?',
          a: 'Yes, with a recent utility bill and a no-objection letter from the owner.',
        },
        {
          q: 'What does a company need to do every year?',
          a: 'Hold board meetings, keep accounts audited, and file annual returns with the ROC and income tax returns. Our Annual Compliance service covers this.',
        },
      ],
    },
  },

  'llp-registration': {
    packages: [
      {
        id: 'basic',
        name: 'Basic',
        price: 1499,
        deliveryTime: '7-10 days',
        includes: [
          'Name check and approval',
          'Digital signatures for 2 designated partners',
          'Certificate of incorporation with LLP PAN and TAN',
        ],
      },
      {
        id: 'standard',
        name: 'Standard',
        price: 3999,
        deliveryTime: '12-15 days',
        recommended: true,
        includes: ['Everything in Basic', 'LLP agreement drafted and filed', 'GST registration'],
      },
      {
        id: 'premium',
        name: 'Premium',
        price: 7999,
        deliveryTime: '15-20 days',
        includes: [
          'Everything in Standard',
          'Help opening the LLP bank account',
          'A call with a professional for your first-year plan',
        ],
      },
    ],
    page: {
      intro:
        'A limited liability partnership (LLP) gives partners the flexibility of a partnership with limited liability. It has fewer compliance requirements than a company, which suits professional firms and small businesses.',
      whoFor: ['Professional firms', 'Small businesses run by partners', 'Partners who want limited liability'],
      included: ['Filed with the Registrar through the MCA portal', 'LLP PAN and TAN with the certificate'],
      documents: [
        'PAN and Aadhaar of every partner',
        'A recent photo of each partner',
        'Address proof of each partner (not older than 2 months)',
        'Registered office proof: a utility bill, and the owner’s NOC or the rent agreement',
      ],
      notIncluded: [NOT_INCLUDED.gov, 'Yearly LLP filings (see LLP Filing)'],
      timeline: ['Name approval', 'Queries from the Registrar'],
      costs: costs({gov: true}),
      deliverables: ['Certificate of incorporation', 'LLP PAN and TAN', 'LLP agreement (Standard and Premium)'],
      mistakes: ['Filing the LLP agreement after 30 days', 'Unclear profit shares between partners'],
      steps: [
        {title: 'Tell us about your LLP', body: 'Proposed names, partners and their contribution.'},
        {title: 'Signatures and name', body: 'We get digital signatures and reserve your LLP name.'},
        {title: 'Incorporation', body: 'We file the incorporation form and you get the certificate.'},
        {title: 'LLP agreement', body: 'The agreement between partners is filed after incorporation (Standard).'},
      ],
      benefits: [
        {title: 'Limited liability', body: 'Each partner’s liability is limited to their agreed contribution.'},
        {title: 'Fewer filings', body: 'No board meetings, and an audit only above set limits.'},
      ],
      faqs: [
        {
          q: 'How many partners do I need?',
          a: 'At least two designated partners, and at least one of them must be resident in India.',
        },
        {
          q: 'When is the LLP agreement due?',
          a: 'It must be filed within 30 days of incorporation. The Standard and Premium packages include it.',
        },
      ],
    },
  },

  opc: {
    packages: [
      {
        id: 'basic',
        name: 'Basic',
        price: 1799,
        deliveryTime: '7-10 days',
        includes: [
          'Name check and approval',
          'Digital signature and DIN for the director',
          'MOA and AOA drafted',
          'Certificate of incorporation with PAN and TAN',
        ],
      },
      {
        id: 'standard',
        name: 'Standard',
        price: 4499,
        deliveryTime: '10-14 days',
        recommended: true,
        includes: ['Everything in Basic', 'GST registration', 'Help opening the company bank account'],
      },
    ],
    page: {
      intro:
        'A one person company (OPC) lets a single founder run a company with limited liability. It suits solo founders who want a company structure without a partner.',
      whoFor: ['Solo founders', 'Freelancers growing into a business'],
      included: [ROC, 'A nominee named to take over if the member cannot continue'],
      documents: [
        'PAN and Aadhaar of the director and the nominee',
        'A recent photo of the director',
        'Address proof of the director (not older than 2 months)',
        'Registered office proof: a utility bill, and the owner’s NOC or the rent agreement',
      ],
      notIncluded: [NOT_INCLUDED.gov, 'Annual ROC filings'],
      timeline: ['Name approval', 'Queries from the Registrar'],
      costs: costs({gov: true}),
      deliverables: ['Certificate of incorporation', 'PAN and TAN', 'MOA and AOA'],
      mistakes: ['A nominee who has not consented in writing'],
      steps: [
        {title: 'Tell us about your company', body: 'Proposed names, the director, the nominee and the business.'},
        {title: 'Signature and name', body: 'We get the digital signature and apply for the name.'},
        {title: 'Incorporation', body: 'We file the forms and you get the certificate with PAN and TAN.'},
      ],
      benefits: [
        {title: 'Limited liability alone', body: 'Your personal assets are separate from the company’s.'},
        {title: 'Room to grow', body: 'An OPC can later convert into a private limited company.'},
      ],
      faqs: [
        {q: 'Who can start an OPC?', a: 'An Indian citizen who is resident in India, with a nominee.'},
        {q: 'Why a nominee?', a: 'The nominee becomes the member if the founder dies or cannot continue.'},
      ],
    },
  },

  'gst-registration': {
    packages: [
      {
        id: 'basic',
        name: 'Basic',
        price: 999,
        deliveryTime: '3-7 days',
        includes: [
          'GST application prepared and filed',
          'GSTIN and registration certificate',
          'Replies to officer queries',
        ],
      },
      {
        id: 'standard',
        name: 'Standard',
        price: 2499,
        deliveryTime: '3-7 days',
        recommended: true,
        includes: ['Everything in Basic', 'First 3 months of GST return filing'],
      },
      {
        id: 'premium',
        name: 'Premium',
        price: 6999,
        deliveryTime: '3-7 days',
        includes: [
          'Everything in Basic',
          'First 12 months of GST return filing',
          'A named accountant for your returns',
        ],
      },
    ],
    page: {
      intro:
        'GST registration gives your business a GSTIN, so you can collect GST, claim input tax credit and sell across states and online marketplaces. It is required once your turnover crosses the limit, and for some businesses from the first sale.',
      whoFor: [
        'Businesses above the turnover limit',
        'Sellers on online marketplaces and inter-state sellers',
        'Anyone who wants to claim input tax credit',
      ],
      included: ['Help choosing the right registration type', 'Application on the GST portal'],
      documents: [
        'PAN of the business or the owner',
        'Aadhaar and a photo of the owner, partners or directors',
        'Proof of the business address (utility bill, and rent agreement or NOC)',
        'A cancelled cheque or bank statement',
        'Company or LLP certificate, or partnership deed, where it applies',
      ],
      notIncluded: ['Returns after the period the package covers', 'Registration in other states'],
      timeline: ['Aadhaar authentication of the applicant', 'An officer query or a site visit'],
      costs: costs(),
      deliverables: ['GSTIN', 'GST registration certificate', 'A note of your return due dates'],
      mistakes: [
        'Address proof in a different name without a NOC',
        'Wrong business type or principal place of business',
      ],
      steps: [
        {title: 'Share your details', body: 'Business, address and owners, with the documents.'},
        {title: 'We file', body: 'We prepare and file the application on the GST portal.'},
        {title: 'Verification', body: 'Aadhaar authentication, and replies if the officer asks anything.'},
        {title: 'GSTIN issued', body: 'You get your GSTIN and registration certificate.'},
      ],
      benefits: [
        {title: 'Input tax credit', body: 'Claim the GST you pay on purchases.'},
        {title: 'Sell anywhere', body: 'Sell across states and on marketplaces that need a GSTIN.'},
      ],
      faqs: [
        {
          q: 'When is GST registration required?',
          a: 'When turnover crosses the limit (₹40 lakh for most sellers of goods and ₹20 lakh for services, lower in some states), and from the start for inter-state sellers of goods and most marketplace sellers. We check your case.',
        },
        {
          q: 'Do I have to file returns after registering?',
          a: 'Yes, every registered business files GST returns, even with no sales.',
        },
      ],
    },
  },

  'gst-filing': {
    packages: [
      {
        id: 'monthly',
        name: 'One month',
        price: 599,
        deliveryTime: 'Before the due date',
        includes: ['GSTR-1 and GSTR-3B for one month', 'Input tax credit matched with GSTR-2B'],
      },
      {
        id: 'quarter',
        name: 'Three months',
        price: 1599,
        deliveryTime: 'Before each due date',
        recommended: true,
        includes: [
          'GSTR-1 and GSTR-3B for three months',
          'Input tax credit matched with GSTR-2B',
          'Due date reminders',
        ],
      },
      {
        id: 'year',
        name: 'Twelve months',
        price: 5999,
        deliveryTime: 'Before each due date',
        includes: ['Everything in Three months, for a year', 'Annual return (GSTR-9) where it applies'],
      },
    ],
    page: {
      intro:
        'Every GST-registered business files returns, even in a month with no sales. We prepare and file them on time from your sales and purchase details, and match your input tax credit.',
      whoFor: ['Every GST-registered business', 'Businesses on the quarterly (QRMP) scheme'],
      included: ['Returns filed on the GST portal', 'A summary of tax paid and credit claimed'],
      documents: [
        'Sales invoices or a sales register',
        'Purchase invoices',
        'GST portal access, or a login we set up with you',
      ],
      notIncluded: ['The tax itself, which you pay on the portal', 'Notices and assessments'],
      timeline: ['When the month’s data reaches us', 'Suppliers who have not filed, so credit is missing'],
      costs: costs({
        extra: [{title: 'Tax, interest and late fees', body: 'Paid by you to the government, not part of our fee.'}],
      }),
      deliverables: ['Filed returns with acknowledgements', 'A summary of tax and credit'],
      mistakes: ['Claiming credit not shown in GSTR-2B', 'Filing a nil return when there were sales'],
      steps: [
        {title: 'Share the month’s data', body: 'Upload sales and purchase details in your dashboard.'},
        {title: 'We prepare', body: 'We match credit with GSTR-2B and work out the tax.'},
        {title: 'You approve and pay', body: 'You check the summary and pay any tax due on the portal.'},
        {title: 'Filed', body: 'We file and share the acknowledgement.'},
      ],
      benefits: [
        {title: 'No late fees', body: 'Filed before the due date, so no late fee or interest.'},
        {title: 'Credit you are owed', body: 'Purchases matched so you claim the right credit.'},
      ],
      faqs: [
        {q: 'What if I had no sales?', a: 'A nil return is still due. We file it for you.'},
        {q: 'Monthly or quarterly?', a: 'Smaller businesses can choose the quarterly scheme. We help you pick.'},
      ],
    },
  },

  'itr-filing': {
    packages: [
      {
        id: 'salary',
        name: 'Salary',
        price: 799,
        deliveryTime: '2-4 days',
        includes: [
          'ITR for salary and one house property',
          'Income checked with AIS and Form 26AS',
          'Old or new regime compared',
        ],
      },
      {
        id: 'capital-gains',
        name: 'Capital gains',
        price: 1999,
        deliveryTime: '3-5 days',
        recommended: true,
        includes: ['Everything in Salary', 'Shares, mutual funds or property sold during the year'],
      },
      {
        id: 'business',
        name: 'Business or profession',
        price: 2999,
        deliveryTime: '4-6 days',
        includes: [
          'Income from business or profession',
          'Presumptive income where it applies',
          'Profit and loss summary',
        ],
      },
    ],
    page: {
      intro:
        'An income tax return reports your income for the year and settles your tax or claims a refund. We prepare it from your documents, check it against your AIS and Form 26AS, and file it for you.',
      whoFor: ['Salaried people', 'Investors with capital gains', 'Freelancers and small business owners'],
      included: ['The right ITR form chosen', 'E-verification help after filing'],
      documents: [
        'PAN and Aadhaar',
        'Form 16 from your employer',
        'Bank interest certificates',
        'Capital gains statements, where you sold investments',
        'Proof of deductions you claim (insurance, investments, rent)',
      ],
      notIncluded: ['Notices from the department (see Tax Notice)', 'Tax audit'],
      timeline: ['AIS or Form 26AS mismatches', 'Waiting for capital gains statements'],
      costs: costs(),
      deliverables: ['Filed ITR with acknowledgement', 'Computation of income'],
      mistakes: ['Leaving out interest or capital gains shown in AIS', 'Not e-verifying within the time allowed'],
      steps: [
        {title: 'Share your documents', body: 'Upload them in your dashboard.'},
        {title: 'We prepare', body: 'We check your income with AIS and Form 26AS and compare the regimes.'},
        {title: 'You approve', body: 'You see the tax or refund before we file.'},
        {title: 'Filed and verified', body: 'We file and help you e-verify.'},
      ],
      benefits: [
        {title: 'Faster refunds', body: 'A correct, verified return is processed sooner.'},
        {title: 'Proof of income', body: 'Returns are asked for loans, visas and tenders.'},
      ],
      faqs: [
        {
          q: 'What is the due date?',
          a: 'For most individuals not under audit, 31 July after the financial year, unless the government extends it.',
        },
        {q: 'What if I miss it?', a: 'A belated return can be filed later in the year, with a late fee.'},
      ],
    },
  },

  'trademark-registration': {
    packages: [
      {
        id: 'basic',
        name: 'Basic',
        price: 1999,
        deliveryTime: '2-3 days filing',
        includes: ['Trademark search', 'Application (TM-A) in one class', 'Use the ™ symbol once filed'],
      },
      {
        id: 'standard',
        name: 'Standard',
        price: 4999,
        deliveryTime: '2-3 days filing',
        recommended: true,
        includes: ['Everything in Basic', 'Reply to an examination report', 'Status tracking until registration'],
      },
      {
        id: 'premium',
        name: 'Premium',
        price: 9999,
        deliveryTime: '2-3 days filing',
        includes: ['Everything in Standard', 'Help with one opposition, with a lawyer', 'Logo and word mark advice'],
      },
    ],
    page: {
      intro:
        'A registered trademark protects your brand name, logo or slogan, so others cannot use it for similar goods or services. We search for clashes, choose the right class and file your application.',
      whoFor: [
        'New brands and startups',
        'Businesses with a logo or product name',
        'Online sellers protecting their listings',
      ],
      included: ['Class chosen from the 45 trademark classes', 'Filed with the Trade Marks Registry'],
      documents: [
        'Applicant’s name and address (person or business)',
        'The brand name, and the logo if any',
        'The goods or services it is used for',
        'The date you started using it, if already in use',
        'MSME or startup certificate, if you have one',
      ],
      notIncluded: ['Registry fees', 'Oppositions and hearings outside the package'],
      timeline: ['Examination by the registry', 'Objections, publication and any opposition'],
      costs: costs({
        gov: true,
        govNote:
          'The registry’s fee per class, which is lower for individuals, startups and small businesses. We confirm it before filing.',
      }),
      deliverables: ['Filed application with its number', 'Registration certificate once granted'],
      mistakes: ['Filing in the wrong class', 'Choosing a descriptive word that cannot be protected'],
      steps: [
        {title: 'Search', body: 'We search the registry for marks like yours.'},
        {title: 'File', body: 'We file the application and you can use ™.'},
        {title: 'Examination', body: 'The registry examines it; we reply to any objection (Standard).'},
        {title: 'Registered', body: 'Once accepted and published without opposition, you can use ®.'},
      ],
      benefits: [
        {title: 'Exclusive right', body: 'The right to use the mark for your goods or services across India.'},
        {title: 'An asset', body: 'A trademark can be licensed or sold.'},
      ],
      faqs: [
        {
          q: 'How long does registration take?',
          a: 'Filing takes days; registration usually takes months, longer if there is an objection or opposition.',
        },
        {q: 'When can I use ®?', a: 'Only after the mark is registered. Use ™ from the day you file.'},
        {
          q: 'Is the government fee included?',
          a: 'The registry fee depends on the applicant and the classes. We tell you the exact amount before filing.',
        },
      ],
    },
  },

  fssai: {
    packages: [
      {
        id: 'registration',
        name: 'Basic registration',
        price: 1499,
        deliveryTime: '7-14 days',
        includes: ['Basic FSSAI registration for small food businesses', 'Application and follow-up'],
      },
      {
        id: 'state',
        name: 'State licence',
        price: 3999,
        deliveryTime: '30-60 days',
        recommended: true,
        includes: ['State FSSAI licence for mid-size food businesses', 'Documents and food safety plan prepared'],
      },
      {
        id: 'central',
        name: 'Central licence',
        price: 7999,
        deliveryTime: '30-60 days',
        includes: ['Central FSSAI licence for large or multi-state businesses', 'Importers and e-commerce sellers'],
      },
    ],
    page: {
      intro:
        'Every food business in India needs FSSAI registration or a licence, by size and type. We check which one you need, prepare the documents and file it.',
      whoFor: [
        'Restaurants, cloud kitchens and caterers',
        'Food makers, traders and stores',
        'Food importers and online sellers',
      ],
      included: ['Help choosing registration, State or Central licence', 'Filed on the FSSAI portal'],
      documents: [
        'Photo and ID proof of the owner',
        'Proof of the business premises',
        'List of food products',
        'Company, LLP or partnership papers, where it applies',
      ],
      notIncluded: [NOT_INCLUDED.gov, 'Yearly returns and renewals'],
      timeline: ['The category you need', 'An inspection for licences'],
      costs: costs({gov: true}),
      deliverables: ['FSSAI registration or licence number', 'Its validity and renewal date'],
      mistakes: ['Applying for registration when a licence is needed', 'Selling before the number is issued'],
      steps: [
        {title: 'Check', body: 'We confirm which registration or licence fits your business.'},
        {title: 'Prepare', body: 'We prepare the forms and documents.'},
        {title: 'File', body: 'We file and follow up with the authority.'},
        {title: 'Issued', body: 'You get your FSSAI number and certificate.'},
      ],
      benefits: [
        {title: 'Sell legally', body: 'Marketplaces and stores ask for a valid FSSAI number.'},
        {title: 'Customer trust', body: 'The FSSAI number on your pack shows you are registered.'},
      ],
      faqs: [
        {
          q: 'Which one do I need?',
          a: 'Usually basic registration up to ₹12 lakh turnover, a State licence up to ₹20 crore, and a Central licence above that or for some business types such as importers. We check your case.',
        },
      ],
    },
  },

  'udyam-msme': {
    packages: [
      {
        id: 'basic',
        name: 'Udyam registration',
        price: 499,
        deliveryTime: '1-2 days',
        includes: ['Udyam registration filed with your Aadhaar', 'Udyam certificate'],
      },
    ],
    page: {
      intro:
        'Udyam registration records your business as a micro, small or medium enterprise (MSME), so you can use government schemes for MSMEs. The government charges nothing for it; our fee is for doing it for you correctly.',
      whoFor: ['Small manufacturers and service businesses', 'Businesses applying for MSME schemes or loans'],
      included: ['Correct business category and activity codes chosen', 'Filed on the Udyam portal'],
      documents: [
        'Aadhaar of the owner, partner or director',
        'PAN of the business',
        'Bank details',
        'GSTIN, if registered',
      ],
      notIncluded: ['Scheme or loan applications'],
      timeline: ['Aadhaar OTP from the owner'],
      costs: costs(),
      deliverables: ['Udyam registration certificate'],
      mistakes: ['Using a different PAN or Aadhaar than the business uses'],
      steps: [
        {title: 'Share your details', body: 'Business, activity and investment.'},
        {title: 'We file', body: 'We file it on the Udyam portal with your Aadhaar OTP.'},
        {title: 'Certificate', body: 'You get the Udyam certificate.'},
      ],
      benefits: [{title: 'MSME schemes', body: 'Use government schemes and protections meant for MSMEs.'}],
      faqs: [{q: 'Is there a government fee?', a: 'No. Udyam registration is free on the government portal.'}],
    },
  },

  iec: {
    packages: [
      {
        id: 'basic',
        name: 'IEC',
        price: 999,
        deliveryTime: '2-4 days',
        includes: ['Import Export Code application with DGFT', 'IEC certificate'],
      },
    ],
    page: {
      intro:
        'An Import Export Code (IEC), issued by the DGFT, is needed to import or export goods and most services from India. It is linked to your PAN and does not expire, though it must be updated every year.',
      whoFor: ['Importers and exporters', 'Online sellers shipping abroad'],
      included: ['Application on the DGFT portal', 'Help with the yearly update'],
      documents: [
        'PAN of the business or owner',
        'Aadhaar of the owner',
        'Address proof of the business',
        'A cancelled cheque or bank certificate',
      ],
      notIncluded: ['The DGFT fee', 'Customs and export registrations beyond the IEC'],
      timeline: ['DGFT processing'],
      costs: costs({gov: true}),
      deliverables: ['IEC certificate'],
      mistakes: ['Not updating the IEC each year'],
      steps: [
        {title: 'Share your details', body: 'Business, address and bank.'},
        {title: 'We file', body: 'We file on the DGFT portal.'},
        {title: 'IEC issued', body: 'You get your IEC certificate.'},
      ],
      benefits: [{title: 'Trade worldwide', body: 'Clear customs and get paid for exports.'}],
      faqs: [{q: 'Does an IEC expire?', a: 'No, but it must be updated on the DGFT portal every year.'}],
    },
  },
};
