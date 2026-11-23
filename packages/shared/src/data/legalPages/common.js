// Small builders the Legal page files share, so each service reads as plain data.
export const step = (title, body) => ({title, body});
export const pair = (title, body) => ({title, body});
export const qa = (q, a) => ({q, a});

/**
 * The parts of a fee: the package price, and the outside charges where an authority sets them. Worded so it promises
 * nothing beyond telling the customer the amount before it is paid.
 */
export function costs({gov = false, govNote, extra = []} = {}) {
  return [
    pair('Professional fee', 'The package price above, for the work listed in the package.'),
    ...(gov
      ? [
          pair(
            'Government charges',
            govNote ??
              'Fees or stamp duty set by the authority for your application. They are not part of the professional fee; we confirm the amount with you before filing.',
          ),
        ]
      : []),
    ...extra,
    pair('Work outside the package', 'Anything not listed is quoted to you separately before it starts.'),
  ];
}

/** The usual "confirmed separately" lines; a service adds its own. */
export const NOT_INCLUDED = {
  gov: 'Government fees, stamp duty and other charges set by the authority',
  later: 'Filings and compliance for later periods, unless the package lists them',
};

// A price that ends in 99, at or above the given amount, as the catalogue's prices do.
const ends99 = (rupees) => Math.ceil((rupees + 1) / 100) * 100 - 1;

/**
 * Three packages for a service priced once: Basic at its price, Standard about 2× and Premium about 3.5×.
 * Consultation-led services add written advice and follow-ups; fixed-price ones add priority and support.
 * Admin → Services & prices can change any of them.
 */
export function tiers({price, deliveryTime, model}, included = []) {
  const consult = model === 'consult';
  return [
    {
      id: 'basic',
      name: 'Basic',
      price,
      deliveryTime: deliveryTime ?? '',
      // The page's own list where it has one (a consultation page already names the call), else a plain line.
      includes: included.length
        ? included.slice(0, 4)
        : [consult ? 'A consultation with an expert on your matter' : 'The work described on this page'],
    },
    {
      id: 'standard',
      name: 'Standard',
      price: ends99(price * 2),
      deliveryTime: deliveryTime ?? '',
      recommended: true,
      includes: consult
        ? ['Everything in Basic', 'A written summary of the advice', 'One follow-up call within 15 days']
        : ['Everything in Basic', 'Priority handling by our team', 'A 30-minute call with the expert on your work'],
    },
    {
      id: 'premium',
      name: 'Premium',
      price: ends99(price * 3.5),
      deliveryTime: deliveryTime ?? '',
      includes: consult
        ? ['Everything in Standard', 'Review of up to 3 documents', 'Priority booking for every call']
        : [
            'Everything in Standard',
            'A named expert from start to finish',
            'Questions on the delivered work answered for 30 days',
          ],
    },
  ];
}
