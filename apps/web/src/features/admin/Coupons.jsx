// Discount codes: create one, switch it off, see how often it was used.
import {useState} from 'react';
import {PRODUCTS} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {formatDate} from '../../lib/format';
import {DataTable} from './DataTable';

const EMPTY = {code: '', kind: 'percent', value: '10', product: '', minAmount: '0', maxUses: '0', expiresAt: ''};
const input = 'w-full min-w-0 rounded-full border border-rule bg-paper px-4 py-2 text-sm outline-none focus:border-ink';

function NewCoupon({onDone}) {
  const [f, setF] = useState(EMPTY);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF((x) => ({...x, [k]: e.target.value}));
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api('/orders/staff/coupons', {
        method: 'POST',
        body: {...f, value: Number(f.value), minAmount: Number(f.minAmount), maxUses: Number(f.maxUses)},
      });
      setF(EMPTY);
      onDone();
    } catch (err) {
      setError(err.message);
    }
  };
  const field = (label, el) => (
    <label className="grid gap-1 text-xs text-muted">
      {label}
      {el}
    </label>
  );
  return (
    <form onSubmit={submit} className="rounded-[22px] border border-rule p-6">
      <p className="eyebrow">New code</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {field(
          'Code',
          <input required value={f.code} onChange={set('code')} placeholder="DIWALI10" className={input} />,
        )}
        {field(
          'Type',
          <select value={f.kind} onChange={set('kind')} className={input}>
            <option value="percent">Percent off</option>
            <option value="flat">Rupees off</option>
          </select>,
        )}
        {field(
          f.kind === 'percent' ? 'Percent (max 90)' : 'Rupees',
          <input type="number" min="1" required value={f.value} onChange={set('value')} className={input} />,
        )}
        {field(
          'Product',
          <select value={f.product} onChange={set('product')} className={input}>
            <option value="">Every product</option>
            {PRODUCTS.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>,
        )}
        {field(
          'Minimum order (₹)',
          <input type="number" min="0" value={f.minAmount} onChange={set('minAmount')} className={input} />,
        )}
        {field(
          'Uses allowed (0 = no limit)',
          <input type="number" min="0" value={f.maxUses} onChange={set('maxUses')} className={input} />,
        )}
        {field(
          'Last day (optional)',
          <input type="date" value={f.expiresAt} onChange={set('expiresAt')} className={input} />,
        )}
        <div className="flex items-end">
          <Button type="submit" variant="accent" icon={null}>
            Create code
          </Button>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm">
          ⚠ {error}
        </p>
      )}
    </form>
  );
}

export function Coupons() {
  const list = useApi('/orders/staff/coupons');
  const toggle = async (c) => {
    await api(`/orders/staff/coupons/${c._id}`, {method: 'PATCH', body: {active: !c.active}});
    list.reload();
  };
  return (
    <div className="space-y-8">
      <NewCoupon onDone={list.reload} />
      <DataTable
        error={list.error}
        rows={list.data}
        empty="No codes yet."
        columns={[
          {label: 'Code', cell: (c) => <span className="font-medium">{c.code}</span>},
          {label: 'Takes off', cell: (c) => (c.kind === 'percent' ? `${c.value}%` : `₹${c.value}`)},
          {label: 'On', cell: (c) => PRODUCTS.find((p) => p.slug === c.product)?.name ?? 'Every product'},
          {label: 'Used', right: true, cell: (c) => `${c.uses}${c.maxUses ? ` / ${c.maxUses}` : ''}`},
          {label: 'Ends', cell: (c) => (c.expiresAt ? formatDate(c.expiresAt) : '—')},
          {
            label: 'State',
            cell: (c) => (
              <button onClick={() => toggle(c)} className="underline underline-offset-4">
                {c.active ? 'On · switch off' : 'Off · switch on'}
              </button>
            ),
          },
        ]}
      />
    </div>
  );
}
