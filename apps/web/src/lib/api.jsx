import {createContext, useCallback, useContext, useEffect, useState} from 'react';

// The access token lives only in memory (15 min). The refresh token is an
// httpOnly cookie the page cannot read; a localStorage flag only says whether
// trying a refresh is worth it, so signed-out visitors make no failing request.
let accessToken = null;
const FLAG = 'pirento.session';
const flag = (on) => {
  try {
    if (on) localStorage.setItem(FLAG, '1');
    else localStorage.removeItem(FLAG);
  } catch {
    /* storage blocked: the session just lasts until reload */
  }
};
const hasFlag = () => {
  try {
    return localStorage.getItem(FLAG) === '1';
  } catch {
    return false;
  }
};

let refreshing = null;
async function refresh() {
  // One refresh for many parallel 401s: the old cookie is single-use.
  refreshing ??= fetch('/api/auth/refresh', {method: 'POST'})
    .then(async (res) => {
      if (!res.ok) throw new Error('signed out');
      const {data} = await res.json();
      accessToken = data.token;
      return data.user;
    })
    .finally(() => (refreshing = null));
  return refreshing;
}

/** fetch with the access token, refreshing once on 401. */
export async function authFetch(url, init = {}) {
  const send = () =>
    fetch(url, {
      ...init,
      headers: {...init.headers, ...(accessToken ? {Authorization: `Bearer ${accessToken}`} : {})},
    });
  let res = await send();
  if (res.status === 401 && !url.startsWith('/api/auth/') && hasFlag()) {
    try {
      await refresh();
      res = await send();
    } catch {
      flag(false);
    }
  }
  return res;
}

export async function api(path, {method = 'GET', body} = {}) {
  const res = await authFetch(`/api${path}`, {
    method,
    headers: body ? {'Content-Type': 'application/json'} : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error?.message ?? 'Could not reach Pirento. Try again.');
  return json.data;
}

// Small fetch hook: {data, error, loading, reload}.
export function useApi(path) {
  const [state, setState] = useState({data: null, error: null, loading: Boolean(path)});
  const load = useCallback(() => {
    if (!path) return;
    setState((s) => ({...s, loading: true}));
    api(path).then(
      (data) => setState({data, error: null, loading: false}),
      (error) => setState({data: null, error, loading: false}),
    );
  }, [path]);
  useEffect(load, [load]);
  return {...state, reload: load};
}

const SessionContext = createContext(null);

export function SessionProvider({children}) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!hasFlag());

  useEffect(() => {
    if (!hasFlag()) return;
    refresh()
      .then(setUser, () => flag(false))
      .finally(() => setReady(true));
  }, []);

  const signIn = (token, nextUser) => {
    accessToken = token;
    flag(true);
    setUser(nextUser);
  };
  const signOut = () => {
    fetch('/api/auth/logout', {method: 'POST'}).catch(() => {});
    accessToken = null;
    flag(false);
    setUser(null);
  };

  return <SessionContext.Provider value={{user, ready, signIn, signOut, setUser}}>{children}</SessionContext.Provider>;
}

export const useSession = () => useContext(SessionContext);

export const inr = (rupees) =>
  new Intl.NumberFormat('en-IN', {style: 'currency', currency: 'INR', maximumFractionDigits: 0}).format(rupees);
