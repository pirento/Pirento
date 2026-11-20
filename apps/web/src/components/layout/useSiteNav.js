// Which links, status text and main button the navbar shows on the current site.
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
    return {items: nav, status: brand.status, cta: user ? ['Dashboard', '/dashboard'] : ['Sign in', '/login']};
  }
  const home = `/${product.slug}`;
  const dashboard = `${home}/dashboard`;
  return {
    items: [
      {label: 'Home', to: home},
      SERVICE_LINK[product.slug]
        ? {label: 'Services', to: SERVICE_LINK[product.slug]}
        : {label: 'How it works', to: `${home}#how`},
      {label: 'Dashboard', to: dashboard},
      {label: 'All products', to: '/products'},
    ],
    status: product.pill,
    cta: user ? ['Dashboard', dashboard] : ['Sign in', `/login?next=${encodeURIComponent(dashboard)}`],
  };
}
