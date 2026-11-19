import {createContext, useCallback, useContext, useEffect, useState} from 'react';

const TOKEN_KEY = 'pirento.token';
const readToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export async function api(path, {method = 'GET', body} = {}) {
  const token = readToken();
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      ...(body ? {'Content-Type': 'application/json'} : {}),
      ...(token ? {Authorization: `Bearer ${token}`} : {}),
    },
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
  const [ready, setReady] = useState(!readToken());

  useEffect(() => {
    if (!readToken()) return;
    api('/auth/me')
      .then(setUser, () => signOut())
      .finally(() => setReady(true));
  }, []);

  const signIn = (token, nextUser) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* private mode: session lasts until reload */
    }
    setUser(nextUser);
  };
  function signOut() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* nothing stored */
    }
    setUser(null);
  }

  return <SessionContext.Provider value={{user, ready, signIn, signOut, setUser}}>{children}</SessionContext.Provider>;
}

export const useSession = () => useContext(SessionContext);

export const inr = (rupees) =>
  new Intl.NumberFormat('en-IN', {style: 'currency', currency: 'INR', maximumFractionDigits: 0}).format(rupees);
