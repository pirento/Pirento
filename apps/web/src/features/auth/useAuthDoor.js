// What every sign-in, sign-up and recovery page shares: whose site this is, where to go after, and signing in.
import {useRef} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {LayoutGrid, ShieldCheck} from 'lucide-react';
import {login} from '../../data/site';
import {useSession} from '../../lib/api/session';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';
import {PRODUCT_ICONS} from '../../lib/productIcons';
import {siteName, useProductSite} from '../../lib/site';

/** A same-site path to return to; anything else (another origin, //evil) is ignored. */
export const safeNext = (value, fallback) => (/^\/(?!\/)/.test(value ?? '') ? value : fallback);

export function useAuthDoor({page, staff = false}) {
  const {user, signIn} = useSession();
  const navigate = useNavigate();
  const product = useProductSite();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next'), staff ? '/admin' : '/dashboard');
  const ref = useRef(null);
  usePageMotion(ref);
  usePageMeta({title: `${page} — ${staff ? 'Pirento Admin' : siteName(product)}`});

  // Each door shows only its own site: a product's pages show that product alone.
  const story = staff ? login.staff : product ? null : login.ecosystem;
  const side = story
    ? {...story, pirento: true, label: staff ? 'Admin' : 'Ecosystem', Icon: staff ? ShieldCheck : LayoutGrid}
    : {eyebrow: product.name, quote: product.quote, line: product.overview, Icon: PRODUCT_ICONS[product.slug]};

  return {
    user,
    product,
    next,
    navigate,
    ref,
    side,
    home: staff || !product ? '/' : `/${product.slug}`,
    homeLabel: staff ? 'Pirento Ecosystem' : siteName(product),
    // Carried across sign-in, sign-up and recovery, so you land where you were going and keep the site's colours.
    query: params.get('next') ? `?next=${encodeURIComponent(next)}` : '',
    signIn: (res) => signIn(res.token, res.user),
  };
}
