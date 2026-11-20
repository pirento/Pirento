// For pages that need an account: sends signed-out visitors to sign in, then back.
import {Navigate, useLocation} from 'react-router-dom';
import {useSession} from '../../lib/api/session';

export function useSignedIn({loginPath = '/login'} = {}) {
  const {user, ready} = useSession();
  const {pathname} = useLocation();
  if (ready && !user) return {redirect: <Navigate to={`${loginPath}?next=${encodeURIComponent(pathname)}`} replace />};
  return {user, ready};
}
