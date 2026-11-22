// Bharat ID for Business: the access request, the company details asked after approval, what a consent can share,
// and the sandbox Bharat IDs test keys answer for. Browser and identity service read the same definitions.
import {INDIAN_STATES} from '../data/intake.js';
import {verhoeffCheckDigit} from './bharatId.js';
import {MOBILE, NAME} from './form.js';

export const BUSINESS_TYPES = [
  'Bank',
  'NBFC',
  'School',
  'College or university',
  'Coaching or training institute',
  'Website or app',
  'Other',
];

const EMAIL = '^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$';

/** What anyone fills in on the public page to ask for access. */
export const BUSINESS_REQUEST = {
  id: 'request',
  title: 'Request access',
  fields: [
    {id: 'company', label: 'Organisation name', maxLength: 120, autoComplete: 'organization'},
    {id: 'type', label: 'Type of organisation', options: BUSINESS_TYPES},
    {id: 'website', label: 'Website', pattern: '^https?://\\S+\\.\\S+$', placeholder: 'https://', maxLength: 200},
    {id: 'contactName', label: 'Your name', pattern: NAME, autoComplete: 'name'},
    {id: 'designation', label: 'Your role', maxLength: 80, autoComplete: 'organization-title'},
    {
      id: 'email',
      label: 'Work email',
      type: 'email',
      pattern: EMAIL,
      autoComplete: 'email',
      maxLength: 200,
      lower: true,
    },
    {id: 'mobile', label: 'Mobile number', pattern: MOBILE, inputMode: 'numeric', placeholder: '10 digits'},
    {id: 'useCase', label: 'What you will use Bharat ID for', maxLength: 500, wide: true},
    {
      id: 'volume',
      label: 'Checks a month (estimate)',
      options: ['Under 1,000', '1,000–10,000', '10,000–1 lakh', 'Over 1 lakh'],
    },
  ],
};

export const ENTITY_TYPES = [
  'Private limited company',
  'Public limited company',
  'LLP',
  'Partnership',
  'Proprietorship',
  'Trust or society',
  'Government body',
  'Other',
];

/** The company's details, asked in the business dashboard once access is approved; needed before going live. */
export const BUSINESS_PROFILE = {
  id: 'profile',
  title: 'Company details',
  intro: 'As on your registration documents. Our team checks them before your live keys open.',
  fields: [
    {id: 'legalName', label: 'Legal name', maxLength: 160},
    {id: 'entity', label: 'Type of entity', options: ENTITY_TYPES},
    {id: 'registrationNo', label: 'CIN or registration number', maxLength: 40, upper: true},
    {
      id: 'pan',
      label: 'Company PAN',
      pattern: '^[A-Z]{5}\\d{4}[A-Z]$',
      upper: true,
      maxLength: 10,
      placeholder: 'AAACB1234C',
    },
    {
      id: 'gstin',
      label: 'GSTIN',
      optional: true,
      upper: true,
      maxLength: 15,
      pattern: '^\\d{2}[A-Z]{5}\\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$',
    },
    {id: 'line', label: 'Registered address', maxLength: 200, autoComplete: 'street-address'},
    {id: 'city', label: 'City or town', autoComplete: 'address-level2'},
    {id: 'state', label: 'State', options: INDIAN_STATES},
    {id: 'pincode', label: 'PIN code', pattern: '^[1-9]\\d{5}$', inputMode: 'numeric'},
    {id: 'signatoryName', label: 'Authorised signatory', pattern: NAME},
    {id: 'signatoryDesignation', label: 'Signatory’s designation', maxLength: 80},
  ],
};

/** What a business may ask a person to share, and the words the person sees. */
export const CONSENT_FIELDS = {
  name: 'Full name',
  dob: 'Date of birth',
  gender: 'Gender',
  address: 'Address',
  pan: 'PAN',
  aadhaarLast4: 'Last 4 digits of Aadhaar',
  mobile: 'Mobile number',
};

const withCheck = (body) => body + verhoeffCheckDigit(body);

/** Sandbox Bharat IDs: with a test key, the first approves every consent, the second declines, the third stays pending. */
export const TEST_BHARAT_IDS = {
  approves: withCheck('900000001'),
  declines: withCheck('900000002'),
  pending: withCheck('900000003'),
};

/** What the sandbox accepts on the check page with a test key (approves ID): this PIN and date of birth, this code. */
export const SANDBOX_AUTH = {pin: '246810', dob: '1990-01-01', code: '000000'};
