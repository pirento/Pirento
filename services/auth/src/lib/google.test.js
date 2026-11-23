// Tests for google.js.
import {test, beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {resetGoogleKeys, verifyGoogleIdToken} from './google.js';

const {privateKey, publicKey} = crypto.generateKeyPairSync('rsa', {modulusLength: 2048});
const other = crypto.generateKeyPairSync('rsa', {modulusLength: 2048}).privateKey;
const jwks = {keys: [{...publicKey.export({format: 'jwk'}), kid: 'k1', alg: 'RS256', use: 'sig'}]};
let fetches = 0;
const certs = async () => {
  fetches++;
  return {ok: true, headers: new Headers({'cache-control': 'max-age=600'}), json: async () => jwks};
};

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
function token(claims, {key = privateKey, kid = 'k1'} = {}) {
  const data = `${b64({alg: 'RS256', kid})}.${b64(claims)}`;
  return `${data}.${crypto.sign('RSA-SHA256', Buffer.from(data), key).toString('base64url')}`;
}
const base = {
  aud: 'cid',
  iss: 'https://accounts.google.com',
  sub: '123',
  email: 'Asha@Example.com',
  email_verified: true,
  exp: Math.floor(Date.now() / 1000) + 600,
  name: 'Asha',
};

beforeEach(() => {
  resetGoogleKeys();
  fetches = 0;
});

test('accepts a token signed by Google for our client, and keeps the keys for the next one', async () => {
  const want = {googleId: '123', email: 'asha@example.com', name: 'Asha'};
  assert.deepEqual(await verifyGoogleIdToken(token(base), 'cid', certs), want);
  assert.deepEqual(await verifyGoogleIdToken(token(base), 'cid', certs), want);
  assert.equal(fetches, 1);
});

test('refuses a forged signature, another audience, an unverified email, an expired token, no keys', async () => {
  await assert.rejects(verifyGoogleIdToken(token(base, {key: other}), 'cid', certs), /could not be confirmed/);
  await assert.rejects(verifyGoogleIdToken(token({...base, aud: 'x'}), 'cid', certs), /could not be confirmed/);
  await assert.rejects(verifyGoogleIdToken(token({...base, email_verified: false}), 'cid', certs), /not verified/);
  await assert.rejects(verifyGoogleIdToken(token({...base, exp: 1}), 'cid', certs), /expired/);
  await assert.rejects(verifyGoogleIdToken('not.a.token', 'cid', certs), /could not be confirmed/);
  resetGoogleKeys();
  await assert.rejects(
    verifyGoogleIdToken(token(base), 'cid', async () => ({ok: false})),
    /could not be confirmed/,
  );
});
