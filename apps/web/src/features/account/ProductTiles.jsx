// Every product as a tile in its own colours, with its live status line.
import {Link} from 'react-router-dom';
import {ArrowUpRight} from 'lucide-react';
import {PRODUCTS} from '@pirento/shared';
import {useProductSummaries} from './useProductSummaries';

export function ProductTiles() {
  const lines = useProductSummaries();
  return (
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {PRODUCTS.map((p) => (
        <li key={p.slug} data-reveal>
          <Link
            to={`/${p.slug}/dashboard`}
            // The brand's dark field with its accent: each tile previews its product's site.
            style={{'--brand': p.color, '--brand-dark': p.dark}}
            className="group flex h-full flex-col rounded-[18px] bg-(--brand-dark) p-5 text-white transition-transform duration-500 ease-ui hover:-translate-y-1"
          >
            <span className="flex items-center justify-between">
              <span aria-hidden className="size-2.5 rounded-[3px] bg-(--brand)" />
              <ArrowUpRight aria-hidden className="size-4 opacity-60 transition-opacity group-hover:opacity-100" />
            </span>
            <span className="mt-6 font-medium">{p.name}</span>
            <span className="mt-1 text-sm text-white/75">{lines[p.slug] ?? 'Open'}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
