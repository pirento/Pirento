// Sign-in pages: /login for everyone (in the colours of the site you came from), /admin/login for staff.
import {useRef} from 'react';
import {Navigate, useNavigate, useSearchParams} from 'react-router-dom';
import {api} from '../../lib/api/client';
import {useSession} from '../../lib/api/session';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';
import {siteName, useProductSite} from '../../lib/site';
import {isStaffRole} from '../admin/adminNav';
import {AuthShell} from './AuthShell';
import {login} from '../../data/site';
import {PRODUCT_ICONS} from '../../lib/productIcons';
import {LayoutGrid, ShieldCheck} from 'lucide-react';
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

  // Each door shows only its own site: a product's sign-in shows that product alone. The staff door is
  // reached only at /admin/login; customer pages never link to it.
  const story = staff ? login.staff : product ? null : login.ecosystem;
  const side = story
    ? {...story, Icon: staff ? ShieldCheck : LayoutGrid}
    : {
        eyebrow: product.name,
        quote: product.quote,
        line: product.overview,
        Icon: PRODUCT_ICONS[product.slug],
      };
  const home = staff || !product ? '/' : `/${product.slug}`;

  return (
    <AuthShell side={side} home={home} homeLabel={staff ? 'Pirento Ecosystem' : siteName(product)} innerRef={ref}>
      {staff ? (
        <StaffSignIn onSignedIn={onSignedIn} />
      ) : (
        <CustomerSignIn
          title={product ? `Sign in to ${product.name}` : 'Sign in to Pirento'}
          product={product}
          onSignedIn={onSignedIn}
          onNamed={onNamed}
          onSkip={() => {
            naming.current = false;
            navigate(next);
          }}
        />
      )}
    </AuthShell>
  );
}

/** /admin/login */
export const StaffLogin = () => <Login staff />;
