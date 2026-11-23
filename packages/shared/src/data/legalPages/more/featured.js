// More questions for the ten featured Legal services, and the general lines that fill any page short of three.
export const MORE_FEATURED = {
  'llp-registration': {
    f: [
      [
        'How is an LLP taxed?',
        'At a flat rate on its profit, and partners pay no further tax on their share of that profit.',
      ],
    ],
  },
  opc: {
    f: [
      [
        'Can an OPC become a private limited company?',
        'Yes. Since the 2021 rule change an OPC can convert at any time, by adding members and directors and filing with the Registrar.',
      ],
    ],
  },
  'udyam-msme': {
    f: [
      [
        'Which category will I fall in?',
        'Micro, small or medium, decided by your investment in plant and machinery and your turnover, as the government notification sets.',
      ],
      [
        'Does it need renewal?',
        'No. It stays valid, but the details are updated each year from your income tax and GST returns.',
      ],
    ],
  },
  fssai: {
    f: [
      [
        'Can I sell food online with FSSAI registration?',
        'Yes. Online sellers and cloud kitchens need FSSAI registration or a licence like any food business, and platforms ask for the number.',
      ],
      [
        'How long is it valid?',
        'One to five years, as you choose when applying, and it must be renewed before it ends.',
      ],
    ],
  },
  iec: {
    f: [
      [
        'Is IEC needed for services exports?',
        'It is needed to claim benefits under the foreign trade policy and is often asked by banks for foreign payments.',
      ],
      ['Is there a fee for IEC?', 'Yes, a small government fee paid on the DGFT portal when applying.'],
    ],
  },
  'gst-registration': {
    f: [
      [
        'Do I need GST if I sell online?',
        'Usually yes. Sellers on e-commerce platforms generally need GST registration, with some exemptions for small service providers.',
      ],
    ],
  },
  'gst-filing': {
    f: [
      [
        'What if I file late?',
        'A late fee for each day and interest on tax paid late; returns must be filed in order, so one late return holds up the next.',
      ],
    ],
  },
  'itr-filing': {
    f: [
      [
        'Can I revise a return after filing?',
        'Yes. A revised return can be filed to correct a mistake, within the time the law allows.',
      ],
    ],
  },
};

/** Lines true of every Pirento Legal order, used only to bring a short section up to three. */
export const GENERAL = {
  // What changes how long it takes, true of every service.
  t: [
    'How quickly you share documents and answer our questions',
    'Questions or objections raised by the authority or the other side',
    'Holidays and portal downtime at the authority',
  ],
  // What is not part of any package unless it says so.
  n: [
    'Work outside this service, quoted separately before it starts',
    'Appearances before a court, tribunal or officer, unless the package lists them',
    'Filings and compliance for later periods, unless the package lists them',
  ],
  m: [
    'Sending blurred or partial documents, which holds up the work',
    'Waiting until the last date to start, leaving no time for queries',
  ],
  b: [
    ['Every step in your dashboard', 'Follow progress, messages and documents in one place in Pirento Legal.'],
    [
      'Price agreed upfront',
      'You see the package price before you pay; outside charges are confirmed before they are paid.',
    ],
  ],
};
