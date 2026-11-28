// Admin → Invoices (finance and superadmins): every invoice issued by itself when an order is paid, by month,
// product and status, with the month's GST totals, a CSV for the GST return, printing many at once, and issuing any
// still missing. Settings is its own tab.
import {useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {Download, Printer, RefreshCw} from 'lucide-react';
import {PRODUCTS, getProduct} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {StatsRow} from '../../components/ui/Blocks';
import {Field} from '../../components/ui/Field';
import {Tag} from '../../components/ui/Tag';
import {api} from '../../lib/api/client';
import {saveFile} from '../../lib/api/binary';
import {useApi} from '../../lib/api/useApi';
import {formatDate, inr} from '../../lib/format';
import {InvoiceSettingsTab} from './InvoiceSettings';

const thisMonth = () => new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 7);
const rs = (p) => inr((p ?? 0) / 100);
const chip = (on) =>
  `rounded-full border px-4 py-2 text-sm ${on ? 'border-ink bg-ink text-paper' : 'border-rule hover:border-ink'}`;

function List() {
  const [month, setMonth] = useState(thisMonth);
  const [product, setProduct] = useState('');
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState([]);
  const [msg, setMsg] = useState('');
  const query = new URLSearchParams({month, product, status, q}).toString();
  const list = useApi(`/orders/staff/invoices?${query}`);
  const d = list.data;
  const t = d?.totals;
  const pick = (id) => setPicked((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id].slice(-50)));
  const run = async (fn) => {
    setMsg('');
    try {
      setMsg((await fn()) ?? '');
    } catch (err) {
      setMsg(`⚠ ${err.message}`);
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="w-44">
          <Field label="Month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>
        <label className="block">
          <span className="text-sm font-medium">Product</span>
          <select
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            className="mt-2 block rounded-[14px] border border-rule bg-paper px-4 py-3"
          >
            <option value="">All products</option>
            {PRODUCTS.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <div className="w-full sm:w-64">
          <Field label="Search (number, order, email, GSTIN)" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {[
          ['', 'All'],
          ['issued', 'Issued'],
          ['cancelled', 'Credit notes'],
        ].map(([v, l]) => (
          <button
            key={v || 'all'}
            type="button"
            aria-pressed={status === v}
            onClick={() => setStatus(v)}
            className={chip(status === v)}
          >
            {l}
          </button>
        ))}
      </div>
      {t && (
        <StatsRow
          compact
          stats={[
            {label: 'Invoices', value: String(t.count)},
            {label: 'Taxable value', value: rs(t.taxable)},
            {label: 'CGST + SGST', value: rs(t.cgst + t.sgst)},
            {label: 'IGST', value: rs(t.igst)},
            {label: 'Total', value: rs(t.total)},
          ]}
        />
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          icon={Download}
          onClick={() =>
            run(() => saveFile(`/orders/staff/invoices/export?${query}`, `invoices-${month || 'all'}.csv`))
          }
        >
          Download CSV
        </Button>
        <Button
          variant="outline"
          icon={RefreshCw}
          onClick={() =>
            run(async () => {
              const {made} = await api('/orders/staff/invoices/sweep', {method: 'POST'});
              list.reload();
              return made ? `${made} invoice${made === 1 ? '' : 's'} issued.` : 'No paid order was missing one.';
            })
          }
        >
          Issue missing
        </Button>
        {picked.length > 0 && (
          <Link
            to={`/admin/invoices/print?ids=${picked.join(',')}`}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm text-paper"
          >
            <Printer aria-hidden className="size-4" /> Print {picked.length}
          </Link>
        )}
        {msg && (
          <p role="status" className="text-sm">
            {msg}
          </p>
        )}
      </div>
      {d?.items.length === 0 && <p className="body">No invoices here.</p>}
      <ul className="border-t border-rule">
        {d?.items.map((i) => (
          <li key={i._id} className="flex flex-wrap items-center gap-4 border-b border-rule py-4">
            <input
              type="checkbox"
              checked={picked.includes(i._id)}
              onChange={() => pick(i._id)}
              aria-label={`Choose invoice ${i.invoiceNo}`}
              className="size-4"
            />
            <span className="min-w-0 flex-1 basis-[calc(100%-3rem)] sm:basis-auto">
              <span className="block font-mono font-medium">{i.invoiceNo}</span>
              <span className="block text-sm text-muted">
                {i.buyer?.name || i.buyer?.email} · order #{i.orderNo} · {getProduct(i.product)?.name} ·{' '}
                {formatDate(i.issuedAt)}
                {i.buyer?.gstin && ` · GSTIN ${i.buyer.gstin}`}
              </span>
            </span>
            <span className="tabular-nums">{rs(i.amounts.total)}</span>
            <Tag tone="rule">{i.kind === 'tax' ? 'Tax invoice' : 'Plain'}</Tag>
            {i.status === 'cancelled' && <Tag tone="accent">{i.creditNote?.no}</Tag>}
            <Link
              to={`/admin/invoices/print?ids=${i._id}`}
              className="rounded-full p-2 hover:bg-stone"
              aria-label={`Print ${i.invoiceNo}`}
            >
              <Printer aria-hidden className="size-4" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Invoices() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'settings' ? 'settings' : 'list';
  return (
    <div className="mt-8 space-y-8">
      <div className="flex gap-2" role="tablist">
        {[
          ['list', 'Invoices'],
          ['settings', 'Settings'],
        ].map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setParams(id === 'settings' ? {tab: id} : {})}
            className={chip(tab === id)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'settings' ? <InvoiceSettingsTab /> : <List />}
    </div>
  );
}
