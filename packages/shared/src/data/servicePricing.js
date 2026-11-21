// Fixed prices for the services other products sell, in rupees.
export const STATIC_SERVICE_PRICES = {
  // --- Pirento Legal ---
  'private-limited-company': {
    product: 'legal',
    name: 'Private Limited Company Registration',
    price: 1999,
    deliveryTime: '7-10 days',
  },
  'llp-registration': {product: 'legal', name: 'LLP Registration', price: 1499, deliveryTime: '7-10 days'},
  opc: {product: 'legal', name: 'One Person Company Registration', price: 1799, deliveryTime: '7-10 days'},
  'sole-proprietorship': {
    product: 'legal',
    name: 'Sole Proprietorship Registration',
    price: 799,
    deliveryTime: '3-5 days',
  },
  'partnership-firm': {
    product: 'legal',
    name: 'Partnership Firm Registration',
    price: 999,
    deliveryTime: '5-7 days',
  },
  'startup-india-registration': {
    product: 'legal',
    name: 'Startup India Registration',
    price: 1299,
    deliveryTime: '5-7 days',
  },
  'udyam-msme': {product: 'legal', name: 'Udyam (MSME) Registration', price: 499, deliveryTime: '1-2 days'},
  fssai: {product: 'legal', name: 'FSSAI License', price: 1499, deliveryTime: '7-14 days'},
  iec: {product: 'legal', name: 'Import Export Code (IEC)', price: 999, deliveryTime: '2-4 days'},
  dsc: {product: 'legal', name: 'Digital Signature Certificate', price: 699, deliveryTime: '1-2 days'},
  'gst-registration': {product: 'legal', name: 'GST Registration', price: 999, deliveryTime: '3-7 days'},
  'gst-filing': {product: 'legal', name: 'GST Filing (monthly)', price: 599, deliveryTime: 'Recurring'},
  'itr-filing': {product: 'legal', name: 'ITR Filing', price: 799, deliveryTime: '2-4 days'},
  'tds-filing': {product: 'legal', name: 'TDS Filing', price: 699, deliveryTime: '2-4 days'},
  'annual-compliance': {
    product: 'legal',
    name: 'Annual Compliance Package',
    price: 4999,
    deliveryTime: 'Annual',
  },
  'trademark-registration': {
    product: 'legal',
    name: 'Trademark Registration',
    price: 1999,
    deliveryTime: '2-3 days filing',
  },
  'trademark-search': {
    product: 'legal',
    name: 'Trademark Search Report',
    price: 499,
    deliveryTime: '1-2 days',
  },
  'copyright-registration': {
    product: 'legal',
    name: 'Copyright Registration',
    price: 2499,
    deliveryTime: '10-15 days',
  },
  'legal-notice': {product: 'legal', name: 'Legal Notice Drafting', price: 1499, deliveryTime: '2-3 days'},
  'cheque-bounce': {product: 'legal', name: 'Cheque Bounce Notice', price: 1499, deliveryTime: '2-3 days'},
  'talk-to-lawyer': {
    product: 'legal',
    name: 'Talk to a Lawyer (30 min)',
    price: 499,
    deliveryTime: 'Same day',
  },
  'talk-to-ca': {product: 'legal', name: 'Talk to a CA (30 min)', price: 499, deliveryTime: 'Same day'},
  'talk-to-cs': {product: 'legal', name: 'Talk to a CS (30 min)', price: 499, deliveryTime: 'Same day'},

  // --- Pirento Black (tax & compliance) --- slug = `black-${serviceId}` so
  // the /product/black/:serviceId pages map to a catalog slug by prefix.
  'black-document-generation': {
    product: 'black',
    name: 'Business Document Generation',
    price: 499,
    deliveryTime: '1-2 days',
  },
  'black-gst': {product: 'black', name: 'GST Management & Filing', price: 599, deliveryTime: 'Recurring'},
  'black-itr': {product: 'black', name: 'Income Tax Return Filing', price: 799, deliveryTime: '2-4 days'},
  'black-tds': {product: 'black', name: 'TDS Management & Filing', price: 699, deliveryTime: '2-4 days'},
  'black-accounting': {
    product: 'black',
    name: 'Accounting & Bookkeeping',
    price: 1499,
    deliveryTime: 'Recurring',
  },
  'black-ai-audit': {product: 'black', name: 'AI Tax Audit & Review', price: 2499, deliveryTime: '3-5 days'},
};

export function getStaticServicePrice(slug) {
  return STATIC_SERVICE_PRICES[slug] ?? null;
}

export function getLegalServicePrice(slug) {
  const entry = STATIC_SERVICE_PRICES[slug];
  return entry && entry.product === 'legal' ? entry : null;
}
