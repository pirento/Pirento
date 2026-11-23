// Uploaded files, sealed with AES-256-GCM before they are stored anywhere. With FILES_S3_BUCKET set the sealed bytes
// go to S3-compatible storage (AWS S3, Cloudflare R2, Backblaze B2 …) and the document keeps only a key to them;
// without it they stay inside the MongoDB document as before (each document is capped at 16 MB). Files saved
// either way keep working after the switch.
import crypto from 'node:crypto';
import {decrypt, encrypt} from './crypto.js';
import {ApiError} from './errors.js';
import {env} from './env.js';

const cfg = () => ({
  bucket: env('FILES_S3_BUCKET', ''),
  endpoint: env('FILES_S3_ENDPOINT', ''), // empty for AWS itself
  region: env('FILES_S3_REGION', 'auto'),
  accessKeyId: env('FILES_S3_KEY_ID', ''),
  secretAccessKey: env('FILES_S3_SECRET', ''),
});

export const fileStoreOn = () => Boolean(cfg().bucket);

// The SDK is loaded only by services that store files, and only once a bucket is set.
let s3;
async function bucket() {
  const c = cfg();
  if (!s3) {
    const sdk = await import('@aws-sdk/client-s3');
    s3 = {
      sdk,
      client: new sdk.S3Client({
        region: c.region === 'auto' && !c.endpoint ? env('AWS_REGION', 'ap-south-1') : c.region,
        ...(c.endpoint && {endpoint: c.endpoint, forcePathStyle: true}),
        ...(c.accessKeyId && {credentials: {accessKeyId: c.accessKeyId, secretAccessKey: c.secretAccessKey}}),
      }),
    };
  }
  return {...s3, Bucket: c.bucket};
}

const unavailable = () => new ApiError(503, 'FILES_UNAVAILABLE', 'File storage is not answering. Try again soon.');

/** Seals `plain` and stores it: returns the fields to save on the file's document. */
export async function sealFile(key, plain, folder) {
  const {iv, tag, data} = encrypt(key, plain);
  if (!fileStoreOn()) return {iv, tag, data};
  const {sdk, client, Bucket} = await bucket();
  const blobKey = `${folder}/${crypto.randomUUID()}`;
  await client.send(new sdk.PutObjectCommand({Bucket, Key: blobKey, Body: data})).catch(() => {
    throw unavailable();
  });
  return {iv, tag, blobKey};
}

/** The plain bytes of a stored file, read from the bucket when they live there. */
export async function openFile(key, doc) {
  if (!doc.blobKey) return decrypt(key, doc);
  const {sdk, client, Bucket} = await bucket();
  const res = await client.send(new sdk.GetObjectCommand({Bucket, Key: doc.blobKey})).catch(() => {
    throw unavailable();
  });
  return decrypt(key, {iv: doc.iv, tag: doc.tag, data: Buffer.from(await res.Body.transformToByteArray())});
}

/** Removes the bucket copies of deleted files. A failure is logged, not thrown: the record is already gone. */
export async function dropFiles(docs) {
  const keys = docs.map((d) => d.blobKey).filter(Boolean);
  if (!keys.length) return;
  const {sdk, client, Bucket} = await bucket();
  await Promise.all(
    keys.map((Key) =>
      client.send(new sdk.DeleteObjectCommand({Bucket, Key})).catch((err) => {
        console.warn(`Could not delete stored file ${Key}: ${err.message}`);
      }),
    ),
  );
}
