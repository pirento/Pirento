// Which site a path belongs to (Pirento or one product), and painting the page in its colours.
import {useLayoutEffect} from 'react';
import {useLocation} from 'react-router-dom';
import {getProduct, getService} from '@pirento/shared';
import {iconDir} from '../components/layout/PirentoLogo';

/**
 * Which product site a path belongs to, or null for the Pirento Ecosystem site.
 * /legal, /legal/dashboard, /services/<legal service>, /checkout/<…> and
 * /login?next=/legal/… all count as Pirento Legal.
 */
export function productFromPath(pathname, search = '') {
  const [a, b] = pathname.split('/').filter(Boolean);
  if (a === 'services' || a === 'checkout') return getProduct(getService(b ?? '')?.product ?? '');
  // Sign-in, sign-up and recovery pages wear the colours of the site you came from (?next=/legal/…).
  if (['login', 'register', 'forgot-password', 'forgot-user-id'].includes(a)) {
    return productFromPath((new URLSearchParams(search).get('next') ?? '').split('?')[0]);
  }
  if (a === 'products' && b) return getProduct(b);
  // The one support desk wears the colours of the product you came from (/support?product=legal).
  if (a === 'support' && !b) return getProduct(new URLSearchParams(search).get('product') ?? '');
  return getProduct(a ?? '');
}

export function useProductSite() {
  const {pathname, search} = useLocation();
  return productFromPath(pathname, search);
}

/** Paints the page in the current product's brand colours: its accent and its dark. */
export function useSiteTheme() {
  const product = useProductSite();
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (product) {
      root.style.setProperty('--accent', product.color);
      root.style.setProperty('--on-accent', product.onColor);
      root.style.setProperty('--product-dark', product.dark);
      root.dataset.product = product.slug;
    } else {
      root.style.removeProperty('--accent');
      root.style.removeProperty('--on-accent');
      root.style.removeProperty('--product-dark');
      delete root.dataset.product;
    }
    // The tab icon follows the site: a product's own icons when it has them, Pirento's otherwise.
    const dir = iconDir(product?.slug);
    const icons = {'32x32': 'favicon-32.png', '192x192': 'icon-192.png'};
    for (const link of document.querySelectorAll('link[rel="icon"]'))
      link.href = `${dir}/${icons[link.sizes.value] ?? 'favicon-32.png'}`;
    const touch = document.querySelector('link[rel="apple-touch-icon"]');
    if (touch) touch.href = `${dir}/apple-touch-icon.png`;
  }, [product]);
  return product;
}

export const siteName = (product) => product?.name ?? 'Pirento Ecosystem';
