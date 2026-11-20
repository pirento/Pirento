// Sign-in pages: /login for everyone (in the colours of the site you came from), /admin/login for staff.
import {useRef} from 'react';
import {Link, Navigate, useNavigate, useSearchParams} from 'react-router-dom';
import {api} from '../../lib/api/client';
import {useSession} from '../../lib/api/session';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';
import {siteName, useProductSite} from '../../lib/site';
import {isStaffRole} from '../admin/adminNav';
import {AuthShell} from './AuthShell';
import {CustomerSignIn} from './CustomerSignIn';
import {StaffSignIn} from './StaffSignIn';

/** A same-site path to return to; anything else (another origin, //evil) is ignored. */
const safeNext = (value, fallback) => (/^\/(?!\/)/.test(value ?? '') ? value : fallback);

export function Login({staff = false}) {
  const {user, signIn, setUser} = useSession();
  const navigate = useNavigate();
  const product = useProductSite();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'), staff ? '/admin' : '/dashboard');
  // True while a first-time customer is still on the "your name" step after signing in.
  const naming = useRef(false);
  const ref = useRef(null);
  usePageMotion(ref);
  usePageMeta({title: `${staff ? 'Staff sign in' : 'Sign in'} — ${staff ? 'Pirento Admin' : siteName(product)}`});

  if (user && !naming.current && (!staff || isStaffRole(user.role))) return <Navigate to={next} replace />;

  const onSignedIn = (res, {stay = false} = {}) => {
    naming.current = stay;
    signIn(res.token, res.user);
    if (!stay) navigate(next);
  };
  const onNamed = async (name) => {
    setUser(await api('/auth/me', {method: 'PATCH', body: {name}}));
    naming.current = false;
    navigate(next);
  };

  const shell = staff
    ? {
        brand: 'Pirento Admin',
        title: 'Staff / sign in.',
        perks: ['Order, Bharat ID and ticket queues', 'Users, money and site settings', 'Every staff action is logged'],
        home: '/',
        homeLabel: 'Pirento Ecosystem',
      }
    : {
        brand: siteName(product),
        title: product ? `Sign in to / ${product.name}.` : 'One account. / Every product.',
        perks: [
          'One account for all ten Pirento products',
          'Sign in with your Bharat ID or an emailed code',
          'Your orders, wallet and ID in one dashboard',
        ],
        home: product ? `/${product.slug}` : '/',
        homeLabel: siteName(product),
      };

  return (
    <AuthShell {...shell} innerRef={ref}>
      {staff ? (
        <StaffSignIn onSignedIn={onSignedIn} />
      ) : (
        <CustomerSignIn
          product={product}
          onSignedIn={onSignedIn}
          onNamed={onNamed}
          onSkip={() => {
            naming.current = false;
            navigate(next);
          }}
        />
      )}
      {!staff && (
        <p className="mt-10 text-sm text-muted">
          Pirento team?{' '}
          <Link to="/admin/login" className="text-ink underline underline-offset-4">
            Staff sign in
          </Link>
        </p>
      )}
    </AuthShell>
  );
}

/** /admin/login */
export const StaffLogin = () => <Login staff />;
