import {INDIAN_STATES} from '../data/intake.js';
import {verhoeffValid} from './bharatId.js';

// The Bharat ID application, step by step. One definition drives the form in
// the browser and the checks on the server, so they can never disagree.
// Sensitive numbers are reduced before they are stored: Aadhaar and the bank
// account keep only their last four digits.

const MOBILE = '^[6-9]\\d{9}$';
const NAME = "^[\\p{L} .'-]{2,80}$";

const adult = (v) => {
  const d = new Date(v);
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 18);
  return /^\d{4}-\d{2}-\d{2}$/.test(v) && d > new Date('1900-01-01') && d <= cutoff ? null : 'You must be 18 or older';
};

export const RELATIONS = ['Spouse', 'Father', 'Mother', 'Son', 'Daughter', 'Brother', 'Sister', 'Other'];

export const ID_SECTIONS = [
  {
    id: 'contact',
    title: 'Contact',
    intro: 'We use your account email. Add a mobile number we can reach you on.',
    fields: [{id: 'mobile', label: 'Mobile number', pattern: MOBILE, inputMode: 'numeric', placeholder: '10 digits'}],
  },
  {
    id: 'personal',
    title: 'Personal details',
    intro: 'Exactly as on your PAN card.',
    fields: [
      {id: 'fullName', label: 'Full name', pattern: NAME, autoComplete: 'name'},
      {id: 'fatherName', label: "Father's name", pattern: NAME},
      {id: 'dob', label: 'Date of birth', type: 'date', check: adult, autoComplete: 'bday'},
      {id: 'gender', label: 'Gender', options: ['Female', 'Male', 'Other', 'Prefer not to say']},
    ],
  },
  {
    id: 'documents',
    title: 'Identity documents',
    intro: 'We check the format and the Aadhaar checksum, then keep only the last 4 Aadhaar digits.',
    fields: [
      {
        id: 'pan',
        label: 'PAN',
        pattern: '^[A-Z]{5}\\d{4}[A-Z]$',
        upper: true,
        placeholder: 'ABCDE1234F',
        maxLength: 10,
      },
      {
        id: 'aadhaar',
        label: 'Aadhaar number',
        inputMode: 'numeric',
        placeholder: '12 digits',
        maxLength: 14,
        check: (v) => (/^[2-9]\d{11}$/.test(v) && verhoeffValid(v) ? null : 'Enter a valid 12-digit Aadhaar number'),
        clean: (v) => v.replace(/\s/g, ''),
        store: (v) => `XXXX XXXX ${v.slice(-4)}`,
      },
    ],
  },
  {
    id: 'address',
    title: 'Address',
    fields: [
      {id: 'line', label: 'House, street and area', autoComplete: 'street-address', maxLength: 200},
      {id: 'city', label: 'City or town', autoComplete: 'address-level2'},
      {id: 'state', label: 'State', options: INDIAN_STATES},
      {id: 'pincode', label: 'PIN code', pattern: '^[1-9]\\d{5}$', inputMode: 'numeric', autoComplete: 'postal-code'},
    ],
  },
  {
    id: 'work',
    title: 'Occupation and income',
    fields: [
      {
        id: 'occupation',
        label: 'Occupation',
        options: ['Salaried', 'Self-employed', 'Business owner', 'Student', 'Homemaker', 'Retired', 'Other'],
      },
      {
        id: 'income',
        label: 'Yearly income',
        options: ['Below ₹2.5 lakh', '₹2.5–5 lakh', '₹5–10 lakh', '₹10–25 lakh', 'Above ₹25 lakh'],
      },
    ],
  },
  {
    id: 'bank',
    title: 'Bank account',
    intro: 'Used to match your name. We keep only the last 4 digits of the account number.',
    fields: [
      {id: 'bankName', label: 'Bank name'},
      {
        id: 'account',
        label: 'Account number',
        inputMode: 'numeric',
        check: (v) => (/^\d{9,18}$/.test(v) ? null : 'Enter a 9 to 18 digit account number'),
        store: (v) => `••••${v.slice(-4)}`,
      },
      {
        id: 'ifsc',
        label: 'IFSC',
        pattern: '^[A-Z]{4}0[A-Z0-9]{6}$',
        upper: true,
        placeholder: 'SBIN0001234',
        maxLength: 11,
      },
      {id: 'upi', label: 'UPI ID', optional: true, pattern: '^[\\w.-]{2,}@[A-Za-z]{2,}$', placeholder: 'name@bank'},
    ],
  },
  {
    id: 'nominee',
    title: 'Nominee and emergency contact',
    fields: [
      {id: 'nomineeName', label: 'Nominee name', pattern: NAME},
      {id: 'nomineeRelation', label: 'Relation to you', options: RELATIONS},
      {id: 'nomineeMobile', label: 'Nominee mobile', pattern: MOBILE, inputMode: 'numeric'},
      {id: 'emergencyName', label: 'Emergency contact name', pattern: NAME},
      {id: 'emergencyMobile', label: 'Emergency contact mobile', pattern: MOBILE, inputMode: 'numeric'},
    ],
  },
];

/** Checks one step. Returns {data} ready to store, or {error} naming the field. */
export function validateSection(sectionId, input) {
  const section = ID_SECTIONS.find((s) => s.id === sectionId);
  if (!section) return {error: 'Unknown step'};
  const data = {};
  for (const f of section.fields) {
    let v = typeof input?.[f.id] === 'string' ? input[f.id].trim() : '';
    if (f.clean) v = f.clean(v);
    if (f.upper) v = v.toUpperCase();
    if (!v) {
      if (f.optional) continue;
      return {error: `Enter ${f.label.toLowerCase()}`, field: f.id};
    }
    if (v.length > (f.maxLength ?? 120)) return {error: `${f.label} is too long`, field: f.id};
    if (f.options && !f.options.includes(v)) return {error: `Choose ${f.label.toLowerCase()}`, field: f.id};
    if (f.pattern && !new RegExp(f.pattern, 'u').test(v))
      return {error: `Enter a valid ${f.label.toLowerCase()}`, field: f.id};
    const problem = f.check?.(v);
    if (problem) return {error: problem, field: f.id};
    data[f.id] = f.store ? f.store(v) : v;
  }
  return {data};
}
