// The numbers at the top of the ecosystem dashboard, each from its own service.
// A service that does not answer leaves its number as a dash; nothing else breaks.
import {useEffect, useState} from 'react';
import {api} from '../../lib/api/client';

const SOURCES = {
  wallet: () => api('/wallet'),
  orders: () => api('/orders'),
  identity: () => api('/identity/me'),
  learning: () => api('/learning/me'),
};

export function useOverview() {
  const [data, setData] = useState({});
  useEffect(() => {
    let live = true;
    for (const [key, load] of Object.entries(SOURCES)) {
      load().then(
        (value) => live && setData((d) => ({...d, [key]: value ?? null})),
        () => live && setData((d) => ({...d, [key]: undefined})),
      );
    }
    return () => {
      live = false;
    };
  }, []);
  return data;
}
