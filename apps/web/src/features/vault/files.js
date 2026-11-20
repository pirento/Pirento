// Vault helpers for binary requests and sizes, on top of the shared ones.
import {raw as rawApi} from '../../lib/api/binary';

export {mb} from '../../lib/api/binary';
export const raw = (path, init) => rawApi(`/vault${path}`, init);
