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
