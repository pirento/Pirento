import {useLayoutEffect} from 'react';
import {useLocation} from 'react-router-dom';
import {getProduct, getService} from '@pirento/shared';

/**
 * Which product site a path belongs to, or null for the Pirento Ecosystem site.
 * /legal, /legal/dashboard, /services/<legal service>, /checkout/<…> and
 * /login?next=/legal/… all count as Pirento Legal.
 */
export function productFromPath(pathname, search = '') {
  const [a, b] = pathname.split('/').filter(Boolean);
  if (a === 'services' || a === 'checkout') return getProduct(getService(b ?? '')?.product ?? '');
  if (a === 'login') return productFromPath((new URLSearchParams(search).get('next') ?? '').split('?')[0]);
  if (a === 'products' && b) return getProduct(b);
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
  }, [product]);
  return product;
}

export const siteName = (product) => product?.name ?? 'Pirento Ecosystem';
