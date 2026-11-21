// The hub's heart: the products you use, each with its live status, what it needs from you, and the way into
// its own dashboard; then the rest of Pirento to explore. The work itself happens in each product.
import {Link} from 'react-router-dom';
import {ArrowUpRight} from 'lucide-react';
import {PRODUCTS} from '@pirento/shared';
import {PRODUCT_ICONS} from '../../lib/productIcons';
import {useProductSummaries} from './useProductSummaries';

/** `needs` is {slug: count} of things waiting on you in that product. */
export function YourProducts({needs}) {
  const summaries = useProductSummaries();
  const used = PRODUCTS.filter((p) => summaries[p.slug]?.used);
  const rest = PRODUCTS.filter((p) => !summaries[p.slug]?.used);
  return (
    <div className="space-y-12">
      {used.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {used.map((p) => {
            const Icon = PRODUCT_ICONS[p.slug];
            return (
              <li key={p.slug}>
                <Link
                  to={`/${p.slug}/dashboard`}
                  style={{'--brand': p.color, '--on-brand': p.onColor}}
                  className="group flex h-full flex-col rounded-[22px] border border-rule p-6 transition-[border-color,transform] duration-500 ease-ui hover:-translate-y-1 hover:border-ink"
                  data-reveal
                >
                  <span className="flex items-start justify-between gap-4">
                    <span className="flex size-12 items-center justify-center rounded-full border border-rule transition-colors duration-500 group-hover:border-(--brand) group-hover:bg-(--brand) group-hover:text-(--on-brand)">
                      <Icon aria-hidden className="size-5" />
                    </span>
                    {needs[p.slug] > 0 && (
                      <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-on-accent">
                        {needs[p.slug]} waiting
                      </span>
                    )}
                  </span>
                  <span className="mt-8 block text-xl">{p.name}</span>
                  <span className="mt-1 block text-sm text-muted">{summaries[p.slug]?.line}</span>
                  <span className="mt-auto flex items-center gap-1.5 pt-8 text-sm font-medium">
                    Open {p.short} dashboard
                    <ArrowUpRight
                      aria-hidden
                      className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-muted">You have not used a Pirento product yet. Pick one below to start.</p>
      )}
      {rest.length > 0 && (
        <div>
          <p className="eyebrow">{used.length ? 'More from Pirento' : 'Start with'}</p>
          <ul className="mt-4 grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((p) => {
              const Icon = PRODUCT_ICONS[p.slug];
              return (
                <li key={p.slug} className="min-w-0">
                  <Link
                    to={`/${p.slug}`}
                    className="group flex items-center gap-3 border-b border-rule py-3.5"
                    data-reveal
                  >
                    <Icon aria-hidden className="size-4 shrink-0 text-muted" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate group-hover:underline">{p.name}</span>
                      <span className="block truncate text-xs text-muted">{p.overview}</span>
                    </span>
                    <ArrowUpRight aria-hidden className="size-4 shrink-0 text-muted" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
