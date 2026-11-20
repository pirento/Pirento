// Which links, status text and main button the navbar shows on the current site.
import {homeFor, isStaffRole} from '../../features/admin/adminNav';
import {brand, nav} from '../../data/site';
import {useSession} from '../../lib/api/session';
import {useProductSite} from '../../lib/site';

const SERVICE_LINK = {
  legal: '/legal/services',
  black: '/black#services',
  green: '/green#services',
  giftox: '/giftox#services',
};

/** Links, status and main button for the site you are on. */
export function useSiteNav() {
  const product = useProductSite();
  const {user} = useSession();
  if (!product) {
    return {
      items: nav,
      status: brand.status,
      cta: user ? [isStaffRole(user.role) ? 'Admin' : 'Dashboard', homeFor(user)] : ['Sign in', '/login'],
    };
  }
  const home = `/${product.slug}`;
  const dashboard = `${home}/dashboard`;
  // Staff have no customer dashboard; their way in is the admin.
  const staff = isStaffRole(user?.role);
  return {
    items: [
      {label: 'Home', to: home},
      SERVICE_LINK[product.slug]
        ? {label: 'Services', to: SERVICE_LINK[product.slug]}
        : {label: 'How it works', to: `${home}#how`},
      !staff && {label: 'Dashboard', to: dashboard},
      {label: 'All products', to: '/products'},
    ].filter(Boolean),
    status: product.pill,
    cta: user
      ? staff
        ? ['Admin', '/admin']
        : ['Dashboard', dashboard]
      : ['Sign in', `/login?next=${encodeURIComponent(dashboard)}`],
  };
}
