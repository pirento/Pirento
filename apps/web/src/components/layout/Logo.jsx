// The brand mark in the navbar: Pirento Ecosystem, or the current product.
import {Link} from 'react-router-dom';
import {PirentoLogo} from './PirentoLogo';
import {useProductSite} from '../../lib/site';

// Product sites show their own name; on phones only the short part, so Sign in still fits.
export function Logo() {
  const product = useProductSite();
  const prefix = product ? product.name.replace(product.short, '').trim() : '';
  return (
    <Link
      to={product ? `/${product.slug}` : '/'}
      aria-label={product ? product.name : 'Pirento Ecosystem, home'}
      className="flex shrink-0 items-center gap-2.5 font-display text-[0.95rem] font-semibold tracking-[0.04em] whitespace-nowrap uppercase"
    >
      {product ? (
        <>
          <span aria-hidden className="size-2.5 rounded-[3px] bg-accent ring-1 ring-ink" />
          <span>
            {prefix && <span className="hidden sm:inline">{prefix} </span>}
            {product.short}
          </span>
        </>
      ) : (
        <>
          <PirentoLogo alt="" className="h-6 w-auto" />
          <span className="hidden text-xs font-medium text-muted sm:inline">Ecosystem</span>
        </>
      )}
    </Link>
  );
}
