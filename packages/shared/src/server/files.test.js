// Tests for files.js (without a bucket: the sealed bytes stay on the document).
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {keyFrom} from './crypto.js';
import {dropFiles, openFile, sealFile} from './files.js';

test('seals, stores on the document and opens again when no bucket is set', async () => {
  const key = keyFrom('test');
  const doc = await sealFile(key, Buffer.from('a private file'), 'vault/u1');
  assert.ok(doc.data && !doc.blobKey);
  assert.ok(!doc.data.includes(Buffer.from('private')));
  assert.equal((await openFile(key, doc)).toString(), 'a private file');
  await dropFiles([doc]); // nothing in a bucket: nothing to do
});
