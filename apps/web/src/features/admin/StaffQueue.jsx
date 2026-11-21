// Generic staff queue: status filter pills over a list, and optionally a product picker.
import {useState} from 'react';
import {PRODUCTS} from '@pirento/shared';
import {useApi} from '../../lib/api/useApi';
import {useSession} from '../../lib/api/session';

// `byProduct` turns on the product picker; its `none` label, if given, adds requests tied to no product.
export function StaffQueue({path, filters, render, byProduct}) {
  const {user} = useSession();
  const [filter, setFilter] = useState(filters[0].value);
  const [product, setProduct] = useState('');
  // A filter is a status, or a ready query such as "mine=1".
  const query = [filter && (filter.includes('=') ? filter : `status=${filter}`), product && `product=${product}`]
    .filter(Boolean)
    .join('&');
  const queue = useApi(`${path}${query ? `?${query}` : ''}`);
  // Staff limited to some products only get those to pick from; the server enforces the same scope.
  const scoped = user?.role === 'staff' && user.products?.length > 0;
  const choices = scoped ? PRODUCTS.filter((p) => user.products.includes(p.slug)) : PRODUCTS;
  return (
    <>
      {byProduct && choices.length > 1 && (
        <label className="mt-8 flex max-w-xs items-center gap-3 text-sm">
          <span className="shrink-0 text-muted">Product</span>
          <select
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            className="block w-full rounded-full border border-rule bg-paper px-4 py-2 outline-none focus:border-ink"
          >
            <option value="">All products</option>
            {choices.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
            {byProduct.none && !scoped && <option value="none">{byProduct.none}</option>}
          </select>
        </label>
      )}
      <div role="tablist" aria-label="Filter" className="no-scrollbar mt-8 flex gap-2 overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f.label}
            role="tab"
            aria-selected={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm ${filter === f.value ? 'border-ink bg-ink text-paper' : 'border-rule hover:border-ink'}`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="mt-8 border-t border-rule">
        {queue.error && <p className="body py-6">⚠ {queue.error.message}</p>}
        {queue.data?.length === 0 && <p className="body py-6">Nothing here. All caught up.</p>}
        {queue.data?.map((item) => render(item, queue.reload))}
      </div>
    </>
  );
}

// The work queues, shown as sections of the admin dashboard.
