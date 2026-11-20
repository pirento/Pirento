// Services & prices: every service on sale. Finance and superadmins change a price or take a service off sale.
import {useState} from 'react';
import {PRODUCTS, getService, servicesFor} from '@pirento/shared';
import {api} from '../../lib/api/client';
import {useSession} from '../../lib/api/session';
import {inr} from '../../lib/format';
import {usePriceOverrides, useServicesFor} from '../../lib/prices';
import {DataTable} from './DataTable';

const selling = PRODUCTS.filter((p) => servicesFor(p.slug).length > 0);
const CAN_EDIT = ['finance', 'superadmin'];

/** One editable price cell: type a new price, or take the service off sale. */
function PriceCell({s, onSaved}) {
  const base = getService(s.slug).price;
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const save = async (body, question) => {
    if (!confirm(question)) return;
    setError('');
    try {
      await api(`/catalog/staff/prices/${s.slug}`, {method: 'PATCH', body});
      setValue('');
      onSaved();
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save({price: Number(value), offSale: false}, `Sell ${s.name} at ₹${value}? New orders pay this.`);
      }}
      className="flex flex-wrap items-center justify-end gap-2"
    >
      <span className="tabular-nums">
        {s.price == null ? (base == null ? 'On quote' : 'Off sale') : inr(s.price)}
        {s.price != null && base != null && s.price !== base && <span className="text-muted"> (was {inr(base)})</span>}
      </span>
      {base != null && (
        <>
          <label className="sr-only" htmlFor={`price-${s.slug}`}>
            New price for {s.name}
          </label>
          <input
            id={`price-${s.slug}`}
            type="number"
            min="1"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="₹"
            className="w-24 rounded-full border border-rule bg-paper px-3 py-1.5 text-sm outline-none focus:border-ink"
          />
          <button type="submit" disabled={!value} className="text-sm underline underline-offset-4 disabled:opacity-40">
            Set
          </button>
          {s.price == null ? (
            <button
              type="button"
              onClick={() => save({price: null, offSale: false}, `Put ${s.name} back on sale at ${inr(base)}?`)}
              className="text-sm underline underline-offset-4"
            >
              Back on sale
            </button>
          ) : (
            <>
              {s.price !== base && (
                <button
                  type="button"
                  onClick={() => save({price: null, offSale: false}, `Go back to ${inr(base)}?`)}
                  className="text-sm underline underline-offset-4"
                >
                  Reset
                </button>
              )}
              <button
                type="button"
                onClick={() => save({price: null, offSale: true}, `Take ${s.name} off sale?`)}
                className="text-sm text-muted underline underline-offset-4"
              >
                Off sale
              </button>
            </>
          )}
        </>
      )}
      {error && (
        <span role="alert" className="w-full text-right text-sm">
          ⚠ {error}
        </span>
      )}
    </form>
  );
}

export function Services() {
  const [slug, setSlug] = useState(selling[0]?.slug);
  const {user} = useSession();
  const {reload} = usePriceOverrides();
  const rows = useServicesFor(slug);
  const canEdit = CAN_EDIT.includes(user?.role);
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
      <p className="text-sm text-muted">
        {canEdit
          ? 'A new price applies to new orders at once; orders already placed keep theirs.'
          : 'Finance and superadmins can change prices.'}
      </p>
      <DataTable
        rows={rows}
        rowKey={(s) => s.slug}
        columns={[
          {label: 'Service', cell: (s) => s.name},
          {label: 'Category', cell: (s) => s.category},
          {label: 'Delivery', cell: (s) => s.deliveryTime ?? '—'},
          {
            label: 'Price',
            right: true,
            cell: (s) => (canEdit ? <PriceCell s={s} onSaved={reload} /> : s.price == null ? 'On quote' : inr(s.price)),
          },
        ]}
      />
    </div>
  );
}
