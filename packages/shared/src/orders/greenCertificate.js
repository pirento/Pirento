// Pirento Green certificates: one per planted sponsorship, numbered from its order (PG- for trees bought as an
// investment, PF- for trees donated through Pirento Foundation). Browser and orders service both use these.
import {GREEN_DONATION} from '../data/greenDrives.js';

export const isDonation = (order) => order.serviceSlug === GREEN_DONATION.slug;

/** The certificate number of a Green order: PG-100021, or PF-100021 for a donation. */
export const greenCertNo = (order) => `${isDonation(order) ? 'PF' : 'PG'}-${order.orderNo}`;

/** A certificate exists once the team has recorded the planting. */
export const hasGreenCert = (order) => order.product === 'green' && Boolean(order.fulfilment?.site);

/**
 * What a typed reference asks for: a certificate number (PG-/PF-, dash optional) or a bare order number
 * (6–9 digits, so a 10-digit Bharat ID never matches). Null when it is neither.
 */
export function parseGreenRef(ref) {
  const v = String(ref ?? '')
    .trim()
    .toUpperCase()
    .replace(/^#/, '');
  const cert = /^(PG|PF)-?(\d{6,9})$/.exec(v);
  if (cert) return {orderNo: Number(cert[2]), donation: cert[1] === 'PF'};
  if (/^\d{6,9}$/.test(v)) return {orderNo: Number(v), donation: null};
  return null;
}
