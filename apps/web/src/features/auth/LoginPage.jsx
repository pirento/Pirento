// Sign-in pages: /login for everyone (in the colours of the site you came from), /admin/login for staff.
import {useRef} from 'react';
import {Navigate} from 'react-router-dom';
import {api} from '../../lib/api/client';
import {useSession} from '../../lib/api/session';
import {isStaffRole} from '../admin/adminNav';
import {AuthShell} from './AuthShell';
import {CustomerSignIn} from './CustomerSignIn';
import {StaffSignIn} from './StaffSignIn';
import {useAuthDoor} from './useAuthDoor';

export function Login({staff = false}) {
  const door = useAuthDoor({page: staff ? 'Staff sign in' : 'Sign in', staff});
  const {setUser} = useSession();
  // True while someone without a name is still on the "your name" step after signing in.
  const naming = useRef(false);
  const {user, next, navigate, product} = door;

  // The staff door is reached only at /admin/login; customer pages never link to it.
  if (user && !naming.current && (!staff || isStaffRole(user.role))) return <Navigate to={next} replace />;

  const onSignedIn = (res, {stay = false} = {}) => {
    naming.current = stay;
    door.signIn(res);
    if (!stay) navigate(next);
  };
  const leave = () => {
    naming.current = false;
    navigate(next);
  };

  return (
    <AuthShell side={door.side} home={door.home} homeLabel={door.homeLabel} innerRef={door.ref}>
      {staff ? (
        <StaffSignIn onSignedIn={onSignedIn} />
      ) : (
        <CustomerSignIn
          title={product ? `Sign in to ${product.name}` : 'Sign in to Pirento'}
          product={product}
          query={door.query}
          onSignedIn={onSignedIn}
          onNamed={async (name) => {
            setUser(await api('/auth/me', {method: 'PATCH', body: {name}}));
            leave();
          }}
          onSkip={leave}
        />
      )}
    </AuthShell>
  );
}

/** /admin/login */
export const StaffLogin = () => <Login staff />;
