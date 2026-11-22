// How a Bharat ID holder proves it is them after the ID is issued: the methods, how strong each is, and the PIN rule.
// Businesses may use only the methods our team allows them (admin → Bharat ID for Business).

// level: 1 knowledge only · 2 a code to the holder's own mobile and email · 3 Aadhaar or face, through a licensed
// provider · 4 Aadhaar biometrics on a UIDAI-certified device. `expected`: shown, not built yet.
export const AUTH_METHODS = [
  {id: 'pin_dob', label: 'Bharat ID PIN and date of birth', level: 1},
  {id: 'otp', label: 'Codes to the mobile and email on the account', level: 2},
  {id: 'aadhaar_otp', label: 'Aadhaar OTP (through Digio)', level: 3, provider: true},
  {id: 'face', label: 'Face check with liveness (through Digio)', level: 3, provider: true},
  {id: 'app_qr', label: 'Bharat ID app: scan the QR, approve with the PIN', level: 3, expected: true},
  {id: 'fingerprint', label: 'Aadhaar fingerprint (UIDAI-certified device)', level: 4, expected: true},
  {id: 'iris', label: 'Aadhaar iris scan (UIDAI-certified device)', level: 4, expected: true},
];

export const authMethod = (id) => AUTH_METHODS.find((m) => m.id === id);

/** Why a PIN is not allowed, or '' when it is: 6 digits, not all the same, not a straight run. */
export function pinProblem(pin) {
  const p = String(pin ?? '');
  if (!/^\d{6}$/.test(p)) return 'Use exactly 6 digits';
  if (/^(\d)\1{5}$/.test(p)) return 'Do not use the same digit six times';
  if ('0123456789'.includes(p) || '9876543210'.includes(p)) return 'Do not use a straight run like 123456';
  return '';
}
