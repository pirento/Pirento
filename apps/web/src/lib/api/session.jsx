import {createContext, useContext, useEffect, useState} from 'react';
import {flag, hasFlag, refresh, setAccessToken} from './client';

// Who is signed in, for every component: {user, ready, signIn, signOut, setUser}.
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
    setAccessToken(token);
    flag(true);
    setUser(nextUser);
  };
  const signOut = () => {
    fetch('/api/auth/logout', {method: 'POST'}).catch(() => {});
    setAccessToken(null);
    flag(false);
    setUser(null);
  };

  return <SessionContext.Provider value={{user, ready, signIn, signOut, setUser}}>{children}</SessionContext.Provider>;
}

export const useSession = () => useContext(SessionContext);
