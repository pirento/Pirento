// Admin → Shipments: every parcel sent with Blue Dart. A form books one (for a Giftox order by its number, or on its
// own with what is inside), and the list follows each parcel: its waybill, status, latest scan and the scans so far.
import {useState} from 'react';
import {RefreshCw, Truck} from 'lucide-react';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {StatusTag, Tag} from '../../components/ui/Tag';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {formatDate} from '../../lib/format';

const STATUS = {
  created: 'Not booked',
  booked: 'Booked',
  'in-transit': 'On its way',
  delivered: 'Delivered',
  returned: 'Returned',
  failed: 'Attempt failed',
  cancelled: 'Cancelled',
};
const EMPTY = {orderNo: '', purpose: '', name: '', address: '', pincode: '', mobile: '', weightKg: '0.5', value: ''};

function BookForm({onBooked}) {
  const [f, setF] = useState(EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({...f, [k]: e.target.value});
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const s = await api('/orders/staff/shipments', {
        method: 'POST',
        body: {
          ...(f.orderNo && {orderNo: Number(f.orderNo)}),
          purpose: f.purpose,
          to: {name: f.name, address: f.address, pincode: f.pincode, mobile: f.mobile},
          weightKg: Number(f.weightKg),
          value: Number(f.value || 0),
        },
      });
      if (s.error) setError(`Saved, but Blue Dart did not book it: ${s.error}`);
      else setF(EMPTY);
      onBooked();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} noValidate className="grid gap-4 rounded-[22px] border border-rule p-6 sm:grid-cols-2">
      <p className="font-medium sm:col-span-2">Book a parcel</p>
      <Field label="Order number (for a Giftox box)" inputMode="numeric" value={f.orderNo} onChange={set('orderNo')} />
      <Field label="What is inside (without an order)" maxLength={120} value={f.purpose} onChange={set('purpose')} />
      <Field label="Deliver to" required value={f.name} onChange={set('name')} />
      <Field label="Mobile" required inputMode="numeric" maxLength={10} value={f.mobile} onChange={set('mobile')} />
      <div className="sm:col-span-2">
        <Field label="Address" required maxLength={300} value={f.address} onChange={set('address')} />
      </div>
      <Field label="PIN code" required inputMode="numeric" maxLength={6} value={f.pincode} onChange={set('pincode')} />
      <Field label="Weight (kg)" required inputMode="decimal" value={f.weightKg} onChange={set('weightKg')} />
      <Field label="Declared value (₹)" inputMode="numeric" value={f.value} onChange={set('value')} />
      {error && (
        <p role="alert" className="text-sm sm:col-span-2">
          ⚠ {error}
        </p>
      )}
      <div className="sm:col-span-2">
        <Button type="submit" variant="accent" icon={Truck} disabled={busy}>
          {busy ? 'Booking…' : 'Book with Blue Dart'}
        </Button>
      </div>
    </form>
  );
}

function Row({s, onChange}) {
  const [error, setError] = useState('');
  const run = async (path) => {
    setError('');
    try {
      await api(`/orders/staff/shipments/${s._id}/${path}`, {method: 'POST'});
      onChange();
    } catch (err) {
      setError(err.message);
    }
  };
  const last = s.scans?.[0];
  return (
    <details className="border-b border-rule">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4 py-5 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block font-medium">
            #{s.shipmentNo} · {s.to?.name}
            {s.orderNo && <span className="text-muted"> · order #{s.orderNo}</span>}
          </span>
          <span className="block text-sm text-muted">
            {s.awb ? `AWB ${s.awb}` : 'No waybill yet'} · {s.to?.pincode} · {formatDate(s.createdAt)}
            {last && ` · ${last.text}${last.place ? `, ${last.place}` : ''}`}
          </span>
        </span>
        <Tag tone={['failed', 'returned', 'created'].includes(s.status) ? 'accent' : 'rule'}>{STATUS[s.status]}</Tag>
      </summary>
      <div className="grid gap-6 pb-8 md:grid-cols-2">
        <div className="space-y-2 text-sm">
          <p>{s.purpose}</p>
          <p className="text-muted">
            {s.to?.address} · {s.to?.mobile} · {s.weightKg} kg{s.value ? ` · ₹${s.value} declared` : ''}
          </p>
          {s.said && <p>Blue Dart: {s.said}</p>}
          {s.error && <p>⚠ {s.error}</p>}
          <div className="flex flex-wrap gap-2 pt-2">
            {s.awb ? (
              <Button variant="outline" icon={RefreshCw} onClick={() => run('track')}>
                Track now
              </Button>
            ) : (
              s.status === 'created' && (
                <Button variant="primary" icon={null} onClick={() => run('book')}>
                  Book again
                </Button>
              )
            )}
            {['created', 'booked'].includes(s.status) && (
              <Button variant="outline" icon={null} onClick={() => run('cancel')}>
                Cancel
              </Button>
            )}
          </div>
          {error && (
            <p role="alert" className="text-sm">
              ⚠ {error}
            </p>
          )}
        </div>
        {s.scans?.length > 0 && (
          <ol className="border-t border-rule text-sm">
            {s.scans.map((x, i) => (
              <li key={i} className="border-b border-rule py-2">
                <span className="text-muted">{x.at}</span> · {x.text}
                {x.place && <span className="text-muted"> · {x.place}</span>}
              </li>
            ))}
          </ol>
        )}
      </div>
    </details>
  );
}

export function Shipments() {
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const list = useApi(`/orders/staff/shipments?status=${status}&q=${encodeURIComponent(q)}`);
  const d = list.data;
  return (
    <div className="mt-8 space-y-8">
      {d && !d.on && (
        <p className="flex items-center gap-3 text-sm text-muted">
          <StatusTag status="expected" /> Blue Dart is not switched on yet: parcels are saved but not booked.
        </p>
      )}
      <BookForm onBooked={list.reload} />
      <div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {['', ...Object.keys(STATUS)].map((x) => (
              <button
                key={x || 'all'}
                type="button"
                aria-pressed={status === x}
                onClick={() => setStatus(x)}
                className={`rounded-full border px-4 py-2 text-sm ${status === x ? 'border-ink bg-ink text-paper' : 'border-rule hover:border-ink'}`}
              >
                {x ? STATUS[x] : 'All'} {x && <span className="opacity-60">{d?.counts[x] ?? 0}</span>}
              </button>
            ))}
          </div>
          <div className="w-full sm:w-72">
            <Field label="Search (number, AWB or name)" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        {d?.items.length === 0 && <p className="body mt-8">No parcels here.</p>}
        <div className="mt-6 border-t border-rule">
          {d?.items.map((s) => (
            <Row key={s._id} s={s} onChange={list.reload} />
          ))}
        </div>
      </div>
    </div>
  );
}
