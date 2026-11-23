// Tests for google.js.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {verifyGoogleIdToken} from './google.js';

const ok = (body) => async () => ({ok: true, json: async () => body});
const base = {
  aud: 'cid',
  iss: 'https://accounts.google.com',
  sub: '123',
  email: 'Asha@Example.com',
  email_verified: 'true',
  exp: String(Date.now() / 1000 + 600),
  name: 'Asha',
};

test('accepts a token for our client with a verified email', async () => {
  assert.deepEqual(await verifyGoogleIdToken('t', 'cid', ok(base)), {
    googleId: '123',
    email: 'asha@example.com',
    name: 'Asha',
  });
});

test('refuses another audience, an unverified email, an expired token, a failed call', async () => {
  await assert.rejects(verifyGoogleIdToken('t', 'cid', ok({...base, aud: 'other'})), /could not be confirmed/);
  await assert.rejects(verifyGoogleIdToken('t', 'cid', ok({...base, email_verified: 'false'})), /not verified/);
  await assert.rejects(verifyGoogleIdToken('t', 'cid', ok({...base, exp: '1'})), /expired/);
  await assert.rejects(
    verifyGoogleIdToken('t', 'cid', async () => ({ok: false})),
    /could not be confirmed/,
  );
});
