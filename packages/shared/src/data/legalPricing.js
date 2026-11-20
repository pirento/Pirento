export const LEGAL_PRICING = {
  // ── Business Setup & Registration ──  anchors: pvt ltd ₹1,999 · OPC ₹1,799
  'nidhi-company': {price: 4999, deliveryTime: '15-20 days', model: 'fixed'},
  'producer-company': {price: 5999, deliveryTime: '15-20 days', model: 'fixed'},

  // ── Licenses & Registrations ──  anchors: FSSAI ₹1,499 · IEC ₹999
  'trade-license': {price: 1499, deliveryTime: '7-14 days', model: 'fixed'},
  iso: {price: 2999, deliveryTime: '10-15 days', model: 'fixed'},
  bis: {price: 4999, deliveryTime: '20-30 days', model: 'fixed'},
  hallmark: {price: 2999, deliveryTime: '10-15 days', model: 'fixed'},

  // ── GST & Taxation ──  anchors: GST registration ₹999 · GST filing ₹599
  'gst-cancellation': {price: 999, deliveryTime: '3-7 days', model: 'fixed'},
  'gst-revocation': {price: 1499, deliveryTime: '7-14 days', model: 'fixed'},
  // Listed as a "finder" on the site; sold here as a written classification
  // opinion, which is the part that takes an expert.
  'hsn-code-finder': {price: 499, deliveryTime: '1-2 days', model: 'fixed'},

  // ── Accounting & Financial ──  anchors: ITR ₹799 · annual compliance ₹4,999
  accounting: {price: 2499, deliveryTime: 'Monthly', model: 'fixed'},
  'proprietorship-tax': {price: 999, deliveryTime: '2-4 days', model: 'fixed'},
  'llp-tax': {price: 1499, deliveryTime: '3-5 days', model: 'fixed'},
  'corporate-tax': {price: 2999, deliveryTime: '5-7 days', model: 'fixed'},
  'tax-assessment': {price: 4999, deliveryTime: '7-14 days', model: 'consult'},
  'tax-notice': {price: 1999, deliveryTime: '3-5 days', model: 'fixed'},
  'reply-to-notice': {price: 2499, deliveryTime: '3-7 days', model: 'fixed'},
  'virtual-cfo': {price: 9999, deliveryTime: 'Monthly retainer', model: 'consult'},

  // ── Compliance ──
  'llp-filing': {price: 1999, deliveryTime: '5-7 days', model: 'fixed'},
  'secretarial-audit': {price: 9999, deliveryTime: '15-30 days', model: 'consult'},
  'compliance-check': {price: 2999, deliveryTime: '7-10 days', model: 'fixed'},
  'due-diligence': {price: 14999, deliveryTime: '15-30 days', model: 'consult'},
  'rbi-compliance': {price: 7999, deliveryTime: '15-30 days', model: 'consult'},

  // ── Company Changes ──  ROC filings: defined scope, so all fixed
  'add-director': {price: 1499, deliveryTime: '7-10 days', model: 'fixed'},
  'remove-director': {price: 1499, deliveryTime: '7-10 days', model: 'fixed'},
  'increase-capital': {price: 2999, deliveryTime: '10-15 days', model: 'fixed'},
  'change-name': {price: 2999, deliveryTime: '15-20 days', model: 'fixed'},
  'change-address': {price: 2499, deliveryTime: '10-15 days', model: 'fixed'},
  'change-objective': {price: 2999, deliveryTime: '15-20 days', model: 'fixed'},
  'close-company': {price: 4999, deliveryTime: '30-60 days', model: 'fixed'},
  'strike-off': {price: 4999, deliveryTime: '30-60 days', model: 'fixed'},
  'close-llp': {price: 3999, deliveryTime: '30-60 days', model: 'fixed'},
  'add-partner': {price: 1499, deliveryTime: '7-10 days', model: 'fixed'},
  'change-llp-agreement': {price: 1999, deliveryTime: '10-15 days', model: 'fixed'},

  // ── IPR ──  anchors: TM registration ₹1,999 · TM search ₹499
  'tm-objection': {price: 2999, deliveryTime: '7-14 days', model: 'fixed'},
  'tm-renewal': {price: 1999, deliveryTime: '7-14 days', model: 'fixed'},
  'tm-assignment': {price: 2499, deliveryTime: '10-15 days', model: 'fixed'},
  'tm-watch': {price: 999, deliveryTime: 'Annual', model: 'fixed'},
  'well-known-tm': {price: 24999, deliveryTime: '60-90 days', model: 'consult'},
  'patent-search': {price: 1999, deliveryTime: '5-7 days', model: 'fixed'},
  'provisional-patent': {price: 9999, deliveryTime: '10-15 days', model: 'fixed'},
  'patent-registration': {price: 24999, deliveryTime: '90+ days', model: 'consult'},
  // Infringement is litigation — the consultation opens it, the matter is quoted after.
  'tm-infringement': {price: 999, deliveryTime: 'Consultation', model: 'consult'},
  'copyright-infringement': {price: 999, deliveryTime: 'Consultation', model: 'consult'},
  'patent-infringement': {price: 999, deliveryTime: 'Consultation', model: 'consult'},

  // ── Legal Notices ──  anchors: legal notice ₹1,499 · cheque bounce ₹1,499
  'money-recovery': {price: 1499, deliveryTime: '2-3 days', model: 'fixed'},
  'consumer-notice': {price: 1499, deliveryTime: '2-3 days', model: 'fixed'},
  'tenant-notice': {price: 1499, deliveryTime: '2-3 days', model: 'fixed'},

  // ── Legal Documents ──
  agreements: {price: 1999, deliveryTime: '3-5 days', model: 'fixed'},
  contracts: {price: 1999, deliveryTime: '3-5 days', model: 'fixed'},
  drafting: {price: 1499, deliveryTime: '3-5 days', model: 'fixed'},
  policies: {price: 2999, deliveryTime: '5-7 days', model: 'fixed'},
  affidavits: {price: 799, deliveryTime: '1-2 days', model: 'fixed'},

  // ── Labour Law ──
  pf: {price: 1999, deliveryTime: '7-10 days', model: 'fixed'},
  esi: {price: 1999, deliveryTime: '7-10 days', model: 'fixed'},
  'professional-tax': {price: 1499, deliveryTime: '7-10 days', model: 'fixed'},
  'shop-license': {price: 1499, deliveryTime: '7-14 days', model: 'fixed'},
  esop: {price: 9999, deliveryTime: '15-30 days', model: 'consult'},
  posh: {price: 4999, deliveryTime: '10-15 days', model: 'fixed'},
  'labour-compliance': {price: 4999, deliveryTime: 'Monthly', model: 'consult'},
  'labour-advisor': {price: 999, deliveryTime: 'Consultation', model: 'consult'},

  // ── Litigation ──  every one consultation-led: the fee depends on the matter,
  // so the customer buys the consultation (anchored to talk-to-lawyer ₹499).
  'criminal-lawyer': {price: 999, deliveryTime: 'Consultation', model: 'consult'},
  'divorce-lawyer': {price: 999, deliveryTime: 'Consultation', model: 'consult'},
  'family-lawyer': {price: 999, deliveryTime: 'Consultation', model: 'consult'},
  'banking-lawyer': {price: 999, deliveryTime: 'Consultation', model: 'consult'},
  'consumer-lawyer': {price: 999, deliveryTime: 'Consultation', model: 'consult'},
  'labour-lawyer': {price: 999, deliveryTime: 'Consultation', model: 'consult'},
  'litigation-lawyer': {price: 999, deliveryTime: 'Consultation', model: 'consult'},
  'ip-lawyer': {price: 999, deliveryTime: 'Consultation', model: 'consult'},
  'trademark-lawyer': {price: 999, deliveryTime: 'Consultation', model: 'consult'},
  tmt: {price: 1999, deliveryTime: 'Consultation', model: 'consult'},
  'risk-advisory': {price: 4999, deliveryTime: '10-15 days', model: 'consult'},

  // ── Consultation & Support ──  anchors: talk-to-lawyer / CA / CS all ₹499
  'talk-to-ip-lawyer': {price: 499, deliveryTime: 'Same day', model: 'consult'},
  'consumer-complaint': {price: 1999, deliveryTime: '5-7 days', model: 'fixed'},
  'online-complaint': {price: 1499, deliveryTime: '3-5 days', model: 'fixed'},
  'corporate-immigration': {price: 4999, deliveryTime: 'Consultation', model: 'consult'},
  'family-immigration': {price: 2999, deliveryTime: 'Consultation', model: 'consult'},
  'student-immigration': {price: 1999, deliveryTime: 'Consultation', model: 'consult'},
  'immigration-lawyer': {price: 999, deliveryTime: 'Consultation', model: 'consult'},
  'pitch-deck': {price: 9999, deliveryTime: '10-15 days', model: 'fixed'},
  'business-loan': {price: 2999, deliveryTime: 'Consultation', model: 'consult'},
  dpr: {price: 14999, deliveryTime: '15-30 days', model: 'consult'},
};
