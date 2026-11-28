// Invoice rules shared by the browser and the orders service: India's GST state codes, the financial year, how a
// price paid (GST included) splits into taxable value and CGST + SGST or IGST, and the amount in words.

/** States and union territories with their GST state codes (the first two digits of a GSTIN). */
export const GST_STATES = [
  ['01', 'Jammu and Kashmir'],
  ['02', 'Himachal Pradesh'],
  ['03', 'Punjab'],
  ['04', 'Chandigarh'],
  ['05', 'Uttarakhand'],
  ['06', 'Haryana'],
  ['07', 'Delhi'],
  ['08', 'Rajasthan'],
  ['09', 'Uttar Pradesh'],
  ['10', 'Bihar'],
  ['11', 'Sikkim'],
  ['12', 'Arunachal Pradesh'],
  ['13', 'Nagaland'],
  ['14', 'Manipur'],
  ['15', 'Mizoram'],
  ['16', 'Tripura'],
  ['17', 'Meghalaya'],
  ['18', 'Assam'],
  ['19', 'West Bengal'],
  ['20', 'Jharkhand'],
  ['21', 'Odisha'],
  ['22', 'Chhattisgarh'],
  ['23', 'Madhya Pradesh'],
  ['24', 'Gujarat'],
  ['26', 'Dadra and Nagar Haveli and Daman and Diu'],
  ['27', 'Maharashtra'],
  ['29', 'Karnataka'],
  ['30', 'Goa'],
  ['31', 'Lakshadweep'],
  ['32', 'Kerala'],
  ['33', 'Tamil Nadu'],
  ['34', 'Puducherry'],
  ['35', 'Andaman and Nicobar Islands'],
  ['36', 'Telangana'],
  ['37', 'Andhra Pradesh'],
  ['38', 'Ladakh'],
].map(([code, name]) => ({code, name}));

export const STATE_NAMES = GST_STATES.map((s) => s.name);
export const GST_RATES = [0, 5, 12, 18, 28];
export const GSTIN_PATTERN = '^\\d{2}[A-Z]{5}\\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$';

const plain = (s) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z]/g, '');
/** A state by its name (any case, "&" or "and") or by its two-digit code. */
export const gstState = (nameOrCode) =>
  GST_STATES.find((s) => s.code === String(nameOrCode) || plain(s.name) === plain(nameOrCode)) ?? null;
export const isGstin = (v) => new RegExp(GSTIN_PATTERN).test(String(v ?? ''));
export const stateOfGstin = (gstin) => (isGstin(gstin) ? gstState(gstin.slice(0, 2)) : null);

/** The Indian financial year (April to March) of a date, in India time, as "26-27". */
export function financialYear(date = new Date()) {
  const india = new Date(new Date(date).getTime() + 330 * 60_000);
  const y = india.getUTCFullYear() - (india.getUTCMonth() < 3 ? 1 : 0);
  return `${String(y).slice(2)}-${String(y + 1).slice(2)}`;
}

/**
 * The tax inside an amount paid (paise, GST included): its taxable value and the tax, split into CGST and SGST
 * half each within one state, or IGST between states. Rounded to the paisa; the parts always add up to the amount.
 */
export function splitTax(amount, rate, sameState) {
  const taxable = Math.round((amount * 100) / (100 + rate));
  const tax = amount - taxable;
  if (!sameState) return {taxable, cgst: 0, sgst: 0, igst: tax, total: amount};
  const cgst = Math.floor(tax / 2);
  return {taxable, cgst, sgst: tax - cgst, igst: 0, total: amount};
}

const ONES = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const two = (n) => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ''}`);
const three = (n) =>
  [n >= 100 && `${ONES[Math.floor(n / 100)]} Hundred`, n % 100 && two(n % 100)].filter(Boolean).join(' ');

/** Whole rupees in Indian words (lakh, crore). */
function rupeesInWords(n) {
  if (n === 0) return 'Zero';
  const parts = [];
  const crore = Math.floor(n / 10_000_000);
  const lakh = Math.floor((n % 10_000_000) / 100_000);
  const thousand = Math.floor((n % 100_000) / 1000);
  const rest = n % 1000;
  if (crore) parts.push(`${rupeesInWords(crore)} Crore`);
  if (lakh) parts.push(`${two(lakh)} Lakh`);
  if (thousand) parts.push(`${two(thousand)} Thousand`);
  if (rest) parts.push(three(rest));
  return parts.join(' ');
}

/** An amount in paise as it is written on an Indian invoice: "Rupees One Thousand Four Hundred Ninety Nine Only". */
export function amountInWords(paise) {
  const rupees = Math.floor(paise / 100);
  const p = paise % 100;
  return `Rupees ${rupeesInWords(rupees)}${p ? ` and ${two(p)} Paise` : ''} Only`;
}
