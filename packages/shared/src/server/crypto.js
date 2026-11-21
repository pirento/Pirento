// AES-256-GCM with a random 12-byte IV per item. GCM's tag makes any change to
// the stored bytes fail on decrypt instead of returning garbage.
import crypto from 'node:crypto';

export const keyFrom = (secret) => crypto.createHash('sha256').update(secret).digest();

export function encrypt(key, plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([cipher.update(plain), cipher.final()]);
  return {iv, tag: cipher.getAuthTag(), data};
}

export function decrypt(key, {iv, tag, data}) {
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv));
  decipher.setAuthTag(Buffer.from(tag));
  return Buffer.concat([decipher.update(Buffer.from(data)), decipher.final()]);
}
