// Bharat ID for Business: API keys (made, hashed, checked), and the details a consent shares, live or sandbox.
import crypto from 'node:crypto';
import {ApiError} from '@pirento/shared/server';
import {TEST_BHARAT_IDS} from '@pirento/shared';
import {ApiKey} from '../models/ApiKey.js';
import {Business} from '../models/Business.js';

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

// Which business statuses may use which keys.
export const MAY_USE = {test: ['test', 'live_review', 'live'], live: ['live']};

/** A new key: `bid_test_…` or `bid_live_…`, 32 random characters. Returns the key once, and what to store. */
export function newKey(mode) {
  const key = `bid_${mode}_${crypto.randomBytes(24).toString('base64url')}`;
  return {key, hash: sha256(key), prefix: key.slice(0, 13)};
}

/** API middleware: the Bearer key decides the business and the mode. */
export async function requireApiKey(req, _res, next) {
  const key = /^Bearer (bid_(test|live)_[\w-]{20,})$/.exec(req.get('authorization') ?? '')?.[1];
  if (!key) throw new ApiError(401, 'NO_KEY', 'Send your API key as: Authorization: Bearer bid_test_… or bid_live_…');
  const found = await ApiKey.findOneAndUpdate(
    {hash: sha256(key), revokedAt: null},
    {$set: {lastUsedAt: new Date()}, $inc: {uses: 1}},
    {new: true},
  );
  if (!found) throw new ApiError(401, 'BAD_KEY', 'This API key is not valid or was revoked');
  const business = await Business.findById(found.businessId);
  if (!business || !MAY_USE[found.mode].includes(business.status)) {
    throw new ApiError(403, 'NOT_ALLOWED', `This account cannot use ${found.mode} keys right now`);
  }
  req.business = business;
  req.mode = found.mode;
  next();
}

/** The details of an issued application a consent may share, by CONSENT_FIELDS key. */
export function detailsOf(identity) {
  const s = identity.sections ?? {};
  const a = s.address ?? {};
  return {
    name: s.personal?.fullName,
    dob: s.personal?.dob,
    gender: s.personal?.gender,
    address: a.line && {line: a.line, city: a.city, state: a.state, pincode: a.pincode},
    pan: s.documents?.pan,
    aadhaarLast4: s.documents?.aadhaar?.slice(-4),
    mobile: s.contact?.mobile,
  };
}

/** Sandbox answers: made-up details, so tests never touch a real person. */
export const SANDBOX_PERSON = {
  name: 'Asha Test',
  dob: '1990-01-01',
  gender: 'Female',
  address: {line: '1 Test Street', city: 'New Delhi', state: 'Delhi', pincode: '110001'},
  pan: 'ABCDE1234F',
  aadhaarLast4: '0000',
  mobile: '9000000000',
};

export const sandboxStatus = (bharatId) =>
  bharatId === TEST_BHARAT_IDS.approves
    ? 'approved'
    : bharatId === TEST_BHARAT_IDS.declines
      ? 'declined'
      : bharatId === TEST_BHARAT_IDS.pending
        ? 'pending'
        : null;

/** Only the asked-for fields. */
export const pick = (details, fields) => Object.fromEntries(fields.map((f) => [f, details[f] ?? null]));
