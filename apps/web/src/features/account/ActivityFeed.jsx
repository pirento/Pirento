// Everything that happened on your account lately, across products, newest first.
import {Link} from 'react-router-dom';
import {getProduct, statusLabel} from '@pirento/shared';
import {inr} from '../../lib/format';

const when = (d) =>
  new Date(d).toLocaleString('en-IN', {day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit'});

/** Order steps, wallet moves and tickets, flattened into one dated list. */
function events({orders = [], wallet, tickets = []}) {
  const list = [
    ...orders.flatMap((o) =>
      o.timeline.map((t, i) => ({
        key: `${o._id}-${i}`,
        at: t.at,
        dot: getProduct(o.product)?.color,
        title: `${o.serviceName}: ${statusLabel(t.status)}`,
        note: t.note,
        to: `/orders/${o._id}`,
      })),
    ),
    ...(wallet?.transactions ?? []).map((t) => ({
      key: t._id,
      at: t.createdAt,
      title: `${t.type === 'credit' ? 'Added' : 'Paid'} ${inr(t.amount / 100)}`,
      note: t.note,
      to: '/wallet',
    })),
    ...tickets.map((t) => ({
      key: t._id,
      at: t.updatedAt,
      title: `Support: ${t.subject}`,
      note: `#${t.ticketNo}`,
      to: `/support/${t._id}`,
    })),
  ];
  return list.sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 8);
}

export function ActivityFeed({data}) {
  const list = events(data);
  if (list.length === 0)
    return <p className="text-muted">Nothing yet. Your orders, payments and requests will show here.</p>;
  return (
    <ol className="relative border-l border-rule">
      {list.map((e) => (
        <li key={e.key} className="relative pb-6 pl-6 last:pb-0" data-reveal>
          <span
            aria-hidden
            className="absolute top-1.5 -left-[5px] size-[9px] rounded-full border border-paper bg-ink"
            style={e.dot ? {background: e.dot} : undefined}
          />
          <Link to={e.to} className="group block">
            <span className="flex flex-wrap items-baseline justify-between gap-x-4">
              <span className="font-medium group-hover:underline">{e.title}</span>
              <span className="text-xs text-muted tabular-nums">{when(e.at)}</span>
            </span>
            {e.note && <span className="block text-sm text-muted">{e.note}</span>}
          </Link>
        </li>
      ))}
    </ol>
  );
}
