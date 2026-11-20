// Binary requests (file uploads and downloads), which skip the JSON helper but keep the sign-in token.
import {authFetch} from './client';

export const mb = (bytes) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/** fetch under /api, throwing the server's message on failure. */
export async function raw(path, init = {}) {
  const res = await authFetch(`/api${path}`, init);
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error?.message ?? 'Something went wrong');
  return res;
}

/** Sends one chosen file as raw bytes; the name and type travel in headers. */
export const uploadFile = (path, file) =>
  raw(path, {
    method: 'POST',
    headers: {
      'content-type': 'application/octet-stream',
      'x-file-name': encodeURIComponent(file.name),
      'x-file-type': file.type,
    },
    body: file,
  });

/** Downloads a file the server sends as an attachment and saves it under `name`. */
export async function saveFile(path, name) {
  const url = URL.createObjectURL(await (await raw(path)).blob());
  const a = Object.assign(document.createElement('a'), {href: url, download: name});
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
