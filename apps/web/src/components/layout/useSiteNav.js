// Which links, status text and main button the navbar shows on the current site.
import {homeFor, isStaffRole} from '../../features/admin/adminNav';
import {brand, nav, productNav} from '../../data/site';
import {useSession} from '../../lib/api/session';
import {useProductSite} from '../../lib/site';

/** Links, status and main button for the site you are on: Pirento's own, or a product's. */
export function useSiteNav() {
  const product = useProductSite();
  const {user} = useSession();
  const staff = isStaffRole(user?.role);
  if (!product) {
    return {
      items: nav,
      status: brand.status,
      cta: user ? [staff ? 'Admin' : 'Dashboard', homeFor(user)] : ['Sign in', '/login'],
    };
  }
  const home = `/${product.slug}`;
  const dashboard = `${home}/dashboard`;
  const own = productNav[product.slug];
  return {
    items: [
      {label: 'Home', to: home},
      ...own.links.map(([label, to]) => ({label, to})),
      // Staff have no customer dashboard; their way in is the admin, on the button.
      !user && {label: 'Sign in', to: `/login?next=${encodeURIComponent(dashboard)}`},
      user && !staff && {label: 'Dashboard', to: dashboard},
    ].filter(Boolean),
    status: product.pill,
    cta: staff ? ['Admin', '/admin'] : own.cta,
  };
}
