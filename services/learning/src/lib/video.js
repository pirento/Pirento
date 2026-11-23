// Lesson and class videos live in S3-compatible storage (AWS S3, Cloudflare R2, Backblaze B2 …). The browser
// uploads straight to the bucket with a short-lived signed URL, and plays with another: the bytes never pass
// through our servers. The bucket needs CORS allowing PUT and GET from the site's origin.
import crypto from 'node:crypto';
import {GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import {ApiError, env} from '@pirento/shared/server';

const cfg = () => ({
  bucket: env('VIDEO_S3_BUCKET', ''),
  endpoint: env('VIDEO_S3_ENDPOINT', ''), // empty for AWS itself
  region: env('VIDEO_S3_REGION', 'auto'),
  accessKeyId: env('VIDEO_S3_KEY_ID', ''),
  secretAccessKey: env('VIDEO_S3_SECRET', ''),
});

// On AWS the service's own role grants the bucket, so keys are optional; elsewhere (R2, B2) give the keys.
export const videoReady = () => Boolean(cfg().bucket);

let client;
function s3() {
  if (!videoReady()) throw new ApiError(503, 'VIDEO_OFF', 'Video storage is not set up yet');
  const c = cfg();
  client ??= new S3Client({
    region: c.region === 'auto' && !c.endpoint ? env('AWS_REGION', 'ap-south-1') : c.region,
    ...(c.endpoint && {endpoint: c.endpoint, forcePathStyle: true}),
    ...(c.accessKeyId && {credentials: {accessKeyId: c.accessKeyId, secretAccessKey: c.secretAccessKey}}),
  });
  return [client, c.bucket];
}

export const MAX_VIDEO_BYTES = 2 * 1024 ** 3; // 2 GB

/** A new random key and a 30-minute upload URL for it. */
export async function uploadUrl(folder, type) {
  if (!/^video\//.test(type)) throw new ApiError(400, 'BAD_TYPE', 'Choose a video file');
  const [c, Bucket] = s3();
  const key = `${folder}/${crypto.randomUUID()}`;
  const url = await getSignedUrl(c, new PutObjectCommand({Bucket, Key: key, ContentType: type}), {expiresIn: 1800});
  return {key, url};
}

/** A 2-hour URL to play one video. */
export async function playUrl(key) {
  const [c, Bucket] = s3();
  return getSignedUrl(c, new GetObjectCommand({Bucket, Key: key}), {expiresIn: 7200});
}

/** Whether an upload has landed in the bucket (a failed or abandoned one has not). */
export async function videoUploaded(key) {
  const [c, Bucket] = s3();
  try {
    await c.send(new HeadObjectCommand({Bucket, Key: key}));
    return true;
  } catch (err) {
    if (err.$metadata?.httpStatusCode === 404 || err.name === 'NotFound') return false;
    throw err;
  }
}
