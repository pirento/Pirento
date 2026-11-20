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
  return (
    <section
      id="activity"
      aria-labelledby="activity-h"
      className="scroll-mt-24 rounded-[22px] border border-rule p-6 md:p-7"
      data-reveal
    >
      <div className="flex items-baseline justify-between">
        <h2 id="activity-h" className="text-xl">
          Activity
        </h2>
        <Link to="/legal/services" className="text-sm text-muted underline-offset-4 hover:underline">
          New order
        </Link>
      </div>
      {list.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Nothing yet. Your orders, payments and requests will show here.</p>
      ) : (
        <ol className="relative mt-6 border-l border-rule">
          {list.map((e) => (
            <li key={e.key} className="relative pb-5 pl-6 last:pb-0">
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
      )}
    </section>
  );
}
