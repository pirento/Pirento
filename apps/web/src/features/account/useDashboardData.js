// Everything the ecosystem dashboard shows, each part from its own service.
// A part that fails stays `undefined` (shown as a dash); a part that is empty is `null` or [].
import {useEffect, useState} from 'react';
import {api} from '../../lib/api/client';

const SOURCES = {
  wallet: () => api('/wallet'),
  orders: () => api('/orders'),
  identity: () => api('/identity/me'),
  learning: () => api('/learning/me'),
  tickets: () => api('/support'),
};

export function useDashboardData() {
  const [data, setData] = useState({loaded: {}});
  useEffect(() => {
    let live = true;
    for (const [key, load] of Object.entries(SOURCES)) {
      const done = (value) => live && setData((d) => ({...d, [key]: value, loaded: {...d.loaded, [key]: true}}));
      load().then(
        (v) => done(v ?? null),
        () => done(undefined),
      );
    }
    return () => {
      live = false;
    };
  }, []);
  return data;
}

/** Orders that count as money spent: paid and not refunded. */
export const spent = (orders = []) =>
  orders.filter((o) => ['paid', 'in_progress', 'completed'].includes(o.status) && !o.payment?.refunded);
