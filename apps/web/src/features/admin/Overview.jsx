// Admin overview: headline numbers, 30-day charts and paid orders per product.
import {Link} from 'react-router-dom';
import {PRODUCTS, statusLabel} from '@pirento/shared';
import {StatsRow} from '../../components/ui/Blocks';
import {Label} from '../../components/ui/Heading';
import {useApi} from '../../lib/api/useApi';
import {BarChart} from './BarChart';
import {ACCESS_OF} from './adminNav';
import {inr} from '../../lib/format';

export function Overview({me}) {
  // Ask only for what this role may read, so a support login sees no 403s.
  const may = (section) => ACCESS_OF(section).includes(me.role);
  const users = useApi('/auth/admin/stats');
  const orders = useApi(may('orders') ? '/orders/staff/stats' : null);
  const daily = useApi(may('orders') ? '/orders/staff/daily' : null);
  const kyc = useApi(may('bharat-id') ? '/identity/staff/queue' : null);
  const tickets = useApi(may('tickets') ? '/support/staff/queue' : null);
  const d = orders.data;
  const top = Math.max(1, ...Object.values(d?.byProduct ?? {}).map((p) => p.amount));

  return (
    <div className="space-y-12">
      <StatsRow
        stats={[
          {value: String(users.data?.total ?? '—'), label: 'accounts'},
          ...(may('orders') ? [{value: d ? inr(d.revenue / 100) : '—', label: 'paid order value'}] : []),
          ...(may('bharat-id') ? [{value: String(kyc.data?.length ?? '—'), label: 'Bharat IDs to review'}] : []),
          ...(may('tickets') ? [{value: String(tickets.data?.length ?? '—'), label: 'tickets waiting on us'}] : []),
        ]}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <BarChart title="Sign-ups, 30 days" rows={users.data?.signups} value={(r) => r.count} />
        {may('orders') && (
          <>
            <BarChart title="Orders placed, 30 days" rows={daily.data} value={(r) => r.count} />
            <BarChart
              title="Paid value, 30 days"
              rows={daily.data}
              value={(r) => r.paid}
              format={(v) => inr(v / 100)}
            />
          </>
        )}
      </div>
      {may('orders') && (
        <>
          <div>
            <Label n={1}>Orders by status</Label>
            <div className="mt-6 flex flex-wrap gap-2">
              {Object.entries(d?.byStatus ?? {}).map(([status, n]) => (
                <Link
                  key={status}
                  to="/admin/orders"
                  className="rounded-full border border-rule px-4 py-2 text-sm hover:border-ink"
                >
                  {statusLabel(status)} · <span className="tabular-nums">{n}</span>
                </Link>
              ))}
            </div>
          </div>
          <div>
            <Label n={2}>Paid orders by product</Label>
            <ul className="mt-6 space-y-3">
              {PRODUCTS.map((p) => {
                const row = d?.byProduct?.[p.slug];
                return (
                  <li
                    key={p.slug}
                    className="grid grid-cols-[8rem_1fr_auto] items-center gap-4 text-sm sm:grid-cols-[11rem_1fr_9rem]"
                  >
                    <Link to={`/${p.slug}`} className="truncate hover:underline">
                      {p.name}
                    </Link>
                    <span className="h-2 overflow-hidden rounded-full bg-stone" aria-hidden>
                      {/* Each bar in its own product's colour. */}
                      <span
                        className="block h-full rounded-full"
                        style={{width: `${((row?.amount ?? 0) / top) * 100}%`, background: p.color}}
                      />
                    </span>
                    <span className="text-right tabular-nums">
                      {row ? `${inr(row.amount / 100)} · ${row.count}` : '—'}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
