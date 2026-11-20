// Every Pirento product as an app icon in its own colour, with one live line of status.
import {Link} from 'react-router-dom';
import {PRODUCTS} from '@pirento/shared';
import {PRODUCT_ICONS} from '../../lib/productIcons';
import {useProductSummaries} from './useProductSummaries';

export function AppsLauncher() {
  const lines = useProductSummaries();
  return (
    <section aria-labelledby="apps-h">
      <div className="flex items-baseline justify-between">
        <h2 id="apps-h" className="text-xl">
          Your products
        </h2>
        <Link to="/products" className="text-sm text-muted underline-offset-4 hover:underline">
          About each
        </Link>
      </div>
      <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {PRODUCTS.map((p) => {
          const Icon = PRODUCT_ICONS[p.slug];
          return (
            <li key={p.slug}>
              <Link
                to={`/${p.slug}/dashboard`}
                className="group flex h-full items-center gap-3 rounded-[18px] border border-rule p-3 transition-colors hover:border-ink"
                data-reveal
              >
                <span
                  className="flex size-11 shrink-0 items-center justify-center rounded-[12px]"
                  style={{background: p.dark, color: p.color}}
                >
                  <Icon aria-hidden className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {p.short === 'Bharat ID' ? p.name : p.short}
                  </span>
                  <span className="block truncate text-xs text-muted">{lines[p.slug] ?? 'Open'}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
