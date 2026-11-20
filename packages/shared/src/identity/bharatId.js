// Bharat ID: 9-digit body + Verhoeff check digit, first digit never zero.
// The body comes from an atomic counter passed through a multiplicative
// permutation, so IDs are unique by construction but consecutive sign-ups do
// not get consecutive numbers (which would leak volume and invite enumeration).

const D5 = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];
const PERM = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];
const INV = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

export function verhoeffCheckDigit(digits) {
  let c = 0;
  [...digits].reverse().forEach((d, i) => (c = D5[c][PERM[(i + 1) % 8][Number(d)]]));
  return INV[c];
}

export const verhoeffValid = (full) => {
  let c = 0;
  [...full].reverse().forEach((d, i) => (c = D5[c][PERM[i % 8][Number(d)]]));
  return c === 0;
};

const BODY_MIN = 100_000_000;
const BODY_SPAN = 900_000_000; // 2^8 · 3^2 · 5^8
const SCRAMBLE = 282_475_249n; // 7^10, coprime to BODY_SPAN, so the map is a bijection

/** Sequence number (0 … 899,999,999) → 10-digit Bharat ID. */
export function bharatIdFromSeq(seq) {
  const body = String(BODY_MIN + Number((BigInt(seq) * SCRAMBLE) % BigInt(BODY_SPAN)));
  return body + verhoeffCheckDigit(body);
}

export const isBharatId = (value) => /^[1-9]\d{9}$/.test(value ?? '') && verhoeffValid(value);

export const formatBharatId = (id) => id.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
