// Every Pirento product as a card: a round outlined icon badge that fills with the product's colour on hover,
// its name and one live line of status.
import {Link} from 'react-router-dom';
import {PRODUCTS} from '@pirento/shared';
import {PRODUCT_ICONS} from '../../lib/productIcons';
import {useProductSummaries} from './useProductSummaries';

export function AppsLauncher() {
  const lines = useProductSummaries();
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
      {PRODUCTS.map((p) => {
        const Icon = PRODUCT_ICONS[p.slug];
        return (
          <li key={p.slug}>
            <Link
              to={`/${p.slug}/dashboard`}
              style={{'--brand': p.color, '--on-brand': p.onColor}}
              className="group flex h-full flex-col rounded-[18px] border border-rule p-5 transition-[border-color,transform] duration-500 ease-ui hover:-translate-y-1 hover:border-ink"
              data-reveal
            >
              <span className="flex size-11 items-center justify-center rounded-full border border-rule transition-colors duration-500 group-hover:border-(--brand) group-hover:bg-(--brand) group-hover:text-(--on-brand)">
                <Icon aria-hidden className="size-5" />
              </span>
              <span className="mt-6 block truncate font-medium">{p.short === 'Bharat ID' ? p.name : p.short}</span>
              <span className="mt-1 block truncate text-sm text-muted">{lines[p.slug] ?? 'Open'}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
