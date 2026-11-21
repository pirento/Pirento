// The delivery record of a Green or Giftox order: the team fills it in, the customer reads it on their order.
import {useState} from 'react';
import {MapPin, Truck} from 'lucide-react';
import {FULFILMENT} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {api} from '../../lib/api/client';
import {formatDate} from '../../lib/format';

const LIVE = ['paid', 'in_progress', 'completed'];

/** True when this order's product keeps a delivery record and the team can still write it. */
export const takesFulfilment = (order) => Boolean(FULFILMENT[order.product]) && LIVE.includes(order.status);

const mapUrl = ({lat, lng}) => `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`;

/** The saved record, as label/value pairs (and a map link for a planting spot). */
export function FulfilmentRecord({order, className = ''}) {
  const spec = FULFILMENT[order.product];
  const f = order.fulfilment;
  if (!spec || !f) return null;
  const Icon = order.product === 'green' ? MapPin : Truck;
  return (
    <dl className={className}>
      <p className="eyebrow flex items-center gap-2">
        <Icon aria-hidden className="size-4" /> {spec.title}
      </p>
      {spec.fields
        .filter((q) => f[q.id])
        .map((q) => (
          <div key={q.id} className="mt-4 border-t border-rule pt-3">
            <dt className="text-sm text-muted">{q.label}</dt>
            <dd className="mt-1 break-words">{f[q.id]}</dd>
          </div>
        ))}
      {f.lat && f.lng && (
        <a
          href={mapUrl(f)}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block text-sm underline underline-offset-4"
        >
          See the spot on the map
        </a>
      )}
      <p className="mt-4 text-xs text-muted">Recorded {formatDate(f.at)}</p>
    </dl>
  );
}

/** The team's form. Saving again corrects the record; the customer is emailed each time. */
export function FulfilmentForm({order, onSaved}) {
  const spec = FULFILMENT[order.product];
  const [details, setDetails] = useState(() =>
    Object.fromEntries(spec.fields.map((q) => [q.id, order.fulfilment?.[q.id] ?? ''])),
  );
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api(`/orders/staff/${order._id}/fulfilment`, {method: 'PATCH', body: {details}});
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={save} className="space-y-4">
      <p className="eyebrow">{spec.title}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        {spec.fields.map((q) => (
          <Field
            key={q.id}
            label={q.label}
            placeholder={q.placeholder}
            required={Boolean(q.required || q.pattern)}
            value={details[q.id]}
            maxLength={500}
            onChange={(e) => setDetails((d) => ({...d, [q.id]: e.target.value}))}
          />
        ))}
      </div>
      {error && (
        <p role="alert" className="text-sm">
          ⚠ {error}
        </p>
      )}
      <Button type="submit" variant="outline" icon={null} disabled={busy}>
        {order.fulfilment ? 'Update and email the customer' : 'Save and email the customer'}
      </Button>
    </form>
  );
}
