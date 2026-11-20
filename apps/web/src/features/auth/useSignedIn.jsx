// For pages that need an account: sends signed-out visitors to sign in, then back.
// Customer pages also send staff to the admin, so each side only ever sees its own area.
import {Navigate, useLocation} from 'react-router-dom';
import {useSession} from '../../lib/api/session';
import {isStaffRole} from '../admin/adminNav';

/** `area`: 'customer' (the default), or 'any' for pages both sides use, such as one order or one ticket. */
export function useSignedIn({loginPath = '/login', area = 'customer'} = {}) {
  const {user, ready} = useSession();
  const {pathname} = useLocation();
  if (ready && !user) return {redirect: <Navigate to={`${loginPath}?next=${encodeURIComponent(pathname)}`} replace />};
  if (user && area === 'customer' && isStaffRole(user.role)) return {redirect: <Navigate to="/admin" replace />};
  return {user, ready};
}
