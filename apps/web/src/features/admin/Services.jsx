// Services & prices: the catalogue as the server sells it (read-only; prices change in packages/shared).
import {useState} from 'react';
import {PRODUCTS, servicesFor} from '@pirento/shared';
import {inr} from '../../lib/format';
import {DataTable} from './DataTable';

const selling = PRODUCTS.filter((p) => servicesFor(p.slug).length > 0);

export function Services() {
  const [slug, setSlug] = useState(selling[0]?.slug);
  return (
    <div className="space-y-6">
      <div role="tablist" aria-label="Product" className="flex flex-wrap gap-2">
        {selling.map((p) => (
          <button
            key={p.slug}
            role="tab"
            aria-selected={slug === p.slug}
            onClick={() => setSlug(p.slug)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${slug === p.slug ? 'border-ink bg-ink text-paper' : 'border-rule hover:border-ink'}`}
          >
            <span aria-hidden className="size-2 rounded-full" style={{background: p.color}} />
            {p.name} · {servicesFor(p.slug).length}
          </button>
        ))}
      </div>
      <DataTable
        rows={servicesFor(slug)}
        rowKey={(s) => s.slug}
        columns={[
          {label: 'Service', cell: (s) => s.name},
          {label: 'Category', cell: (s) => s.category},
          {label: 'Delivery', cell: (s) => s.deliveryTime ?? '—'},
          {label: 'Price', right: true, cell: (s) => (s.price == null ? 'On quote' : inr(s.price))},
        ]}
      />
    </div>
  );
}
