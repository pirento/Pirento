// The brand mark in the navbar: Pirento Ecosystem, or the current product.
import {Link} from 'react-router-dom';
import {PirentoLogo, SiteLogo, hasLogo} from './PirentoLogo';
import {useProductSite} from '../../lib/site';

// Product sites show their own logo or name; on phones a wide logo shrinks and a name drops its first part,
// so Sign in still fits.
export function Logo() {
  const product = useProductSite();
  const prefix = product ? product.name.replace(product.short, '').trim() : '';
  return (
    <Link
      to={product ? `/${product.slug}` : '/'}
      aria-label={product ? product.name : 'Pirento Ecosystem, home'}
      className="flex shrink-0 items-center gap-2.5 font-display text-[0.95rem] font-semibold tracking-[0.04em] whitespace-nowrap uppercase"
    >
      {product && hasLogo(product.slug) ? (
        <SiteLogo
          brand={product.slug}
          alt=""
          className="h-10 w-auto max-w-[8.5rem] object-contain object-left sm:max-w-none"
        />
      ) : product ? (
        <>
          <span aria-hidden className="size-2.5 rounded-[3px] bg-accent ring-1 ring-ink" />
          <span>
            {prefix && <span className="hidden sm:inline">{prefix} </span>}
            {product.short}
          </span>
        </>
      ) : (
        <PirentoLogo alt="" className="h-6 w-auto" />
      )}
    </Link>
  );
}
