// Vault helpers for binary requests and sizes.
import {authFetch} from '../../lib/api/client';

export const mb = (bytes) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
// Files are binary, so these skip the JSON helper.
export async function raw(path, init = {}) {
  const res = await authFetch(`/api/vault${path}`, init);
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error?.message ?? 'Something went wrong');
  return res;
}
