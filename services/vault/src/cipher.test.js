import {test} from 'node:test';
import assert from 'node:assert/strict';
import {decrypt, encrypt, keyFrom} from './cipher.js';

const key = keyFrom('test-key');

test('round trip, and a fresh IV every time', () => {
  const a = encrypt(key, Buffer.from('secret file'));
  const b = encrypt(key, Buffer.from('secret file'));
  assert.equal(decrypt(key, a).toString(), 'secret file');
  assert.notDeepEqual(a.iv, b.iv);
  assert.notDeepEqual(a.data, b.data);
});

test('tampered bytes or wrong key are refused', () => {
  const box = encrypt(key, Buffer.from('secret file'));
  const tampered = {...box, data: Buffer.from(box.data)};
  tampered.data[0] ^= 1;
  assert.throws(() => decrypt(key, tampered));
  assert.throws(() => decrypt(keyFrom('other'), box));
});
