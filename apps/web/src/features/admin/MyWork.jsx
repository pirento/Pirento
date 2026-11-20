// Admin overview for operations and support staff: the work that is theirs, and the work waiting to be taken.
// Money totals and sign-up charts are for finance and superadmins (Overview.jsx).
import {Link} from 'react-router-dom';
import {StatsRow} from '../../components/ui/Blocks';
import {Label} from '../../components/ui/Heading';
import {useApi} from '../../lib/api/useApi';
import {ACCESS_OF} from './adminNav';

const count = (rows, test) => (rows ? String(rows.filter(test).length) : '—');

export function MyWork({me}) {
  const may = (section) => ACCESS_OF(section).includes(me.role);
  const orders = useApi(may('orders') ? '/orders/staff/queue' : null);
  const tickets = useApi(may('tickets') ? '/support/staff/queue' : null);
  const kyc = useApi(may('bharat-id') ? '/identity/staff/queue' : null);
  const mine = (x) => x.assignee?.id === me._id;
  const free = (x) => !x.assignee?.id;

  const stats = [
    ...(may('orders')
      ? [
          {value: count(orders.data, mine), label: 'orders with you'},
          {value: count(orders.data, free), label: 'orders waiting to be taken'},
        ]
      : []),
    ...(may('tickets')
      ? [
          {value: count(tickets.data, mine), label: 'tickets with you'},
          {value: count(tickets.data, free), label: 'tickets waiting to be taken'},
        ]
      : []),
    ...(may('bharat-id') ? [{value: kyc.data ? String(kyc.data.length) : '—', label: 'Bharat IDs to review'}] : []),
  ];

  return (
    <div className="space-y-12">
      {/* At most three to a row, so five numbers never squeeze onto one line. */}
      <div className="space-y-4">
        {[stats.slice(0, 3), stats.slice(3)]
          .filter((row) => row.length)
          .map((row) => (
            <StatsRow key={row[0].label} stats={row} />
          ))}
      </div>
      <div>
        <Label n={1}>Go to your work</Label>
        <div className="mt-6 flex flex-wrap gap-2">
          {[
            ['orders', 'Orders'],
            ['tickets', 'Tickets'],
            ['bharat-id', 'Bharat ID review'],
            ['openings', 'Openings'],
            ['waitlist', 'Capital waitlist'],
          ]
            .filter(([id]) => may(id))
            .map(([id, label]) => (
              <Link
                key={id}
                to={`/admin/${id}`}
                className="rounded-full border border-rule px-4 py-2 text-sm hover:border-ink"
              >
                {label}
              </Link>
            ))}
        </div>
        <p className="mt-6 max-w-2xl text-sm text-muted">
          You see the work assigned to you and the work nobody has taken yet. Take an item to make it yours; a
          superadmin can hand work to someone else.
        </p>
      </div>
    </div>
  );
}
