// Lesson and class videos live in S3-compatible storage (AWS S3, Cloudflare R2, Backblaze B2 …). The browser
// uploads straight to the bucket with a short-lived signed URL, and plays with another: the bytes never pass
// through our servers. The bucket needs CORS allowing PUT and GET from the site's origin.
import crypto from 'node:crypto';
import {GetObjectCommand, PutObjectCommand, S3Client} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import {ApiError, env} from '@pirento/shared/server';

const cfg = () => ({
  bucket: env('VIDEO_S3_BUCKET', ''),
  endpoint: env('VIDEO_S3_ENDPOINT', ''), // empty for AWS itself
  region: env('VIDEO_S3_REGION', 'auto'),
  accessKeyId: env('VIDEO_S3_KEY_ID', ''),
  secretAccessKey: env('VIDEO_S3_SECRET', ''),
});

export const videoReady = () => {
  const c = cfg();
  return Boolean(c.bucket && c.accessKeyId && c.secretAccessKey);
};

let client;
function s3() {
  if (!videoReady()) throw new ApiError(503, 'VIDEO_OFF', 'Video storage is not set up yet');
  const c = cfg();
  client ??= new S3Client({
    region: c.region,
    ...(c.endpoint && {endpoint: c.endpoint, forcePathStyle: true}),
    credentials: {accessKeyId: c.accessKeyId, secretAccessKey: c.secretAccessKey},
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
