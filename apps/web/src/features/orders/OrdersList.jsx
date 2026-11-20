// Compact list of the signed-in person's orders.
import {Link} from 'react-router-dom';
import {statusLabel} from '@pirento/shared';
import {qty} from './helpers';
import {useApi} from '../../lib/api/useApi';
import {inr} from '../../lib/format';

export function OrdersList() {
  const {data} = useApi('/orders');
  if (!data?.length)
    return (
      <p className="body mt-6">
        No orders yet.{' '}
        <Link to="/products" className="text-ink underline underline-offset-4">
          Browse services
        </Link>
      </p>
    );
  return (
    <ul className="mt-6">
      {data.map((o) => (
        <li key={o._id}>
          <Link
            to={`/orders/${o._id}`}
            className="flex items-center justify-between gap-4 border-b border-rule py-4 hover:border-ink"
          >
            <span>
              <span className="block font-medium">{o.serviceName}</span>
              <span className="text-xs text-muted">
                #{o.orderNo}
                {qty(o)} · {statusLabel(o.status)}
              </span>
            </span>
            <span className="tabular-nums">{inr(o.amount / 100)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

// ── Verify ───────────────────────────────────────────────────────────────

// Bharat IDs are 10 digits; certificates start PC-; everything else is an order code.
