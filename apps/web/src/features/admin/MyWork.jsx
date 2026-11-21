// My work: everything assigned to the signed-in staffer, orders and tickets, in one list.
import {Link} from 'react-router-dom';
import {useApi} from '../../lib/api/useApi';
import {useSession} from '../../lib/api/session';
import {StaffOrder} from '../orders/StaffOrder';
import {TicketRow} from '../support/TicketQueue';
import {Label} from '../../components/ui/Heading';
import {ACCESS_OF} from './adminNav';

export function MyWork() {
  const {user} = useSession();
  const may = (id) => ACCESS_OF(id).includes(user?.role);
  const orders = useApi(may('orders') ? '/orders/staff/queue?mine=1' : null);
  const tickets = useApi(may('tickets') ? '/support/staff/queue?mine=1&status=open' : null);
  const answered = useApi(may('tickets') ? '/support/staff/queue?mine=1&status=answered' : null);
  const empty = (list, what, to) =>
    list.data?.length === 0 && (
      <p className="body py-6">
        No {what} on you.{' '}
        <Link to={to} className="underline underline-offset-4">
          Take one from the queue
        </Link>
        .
      </p>
    );
  let n = 0;
  return (
    <div className="mt-8 space-y-14">
      {may('orders') && (
        <div>
          <Label n={++n}>Orders I am working on</Label>
          <div className="mt-6 border-t border-rule">
            {orders.error && <p className="body py-6">⚠ {orders.error.message}</p>}
            {empty(orders, 'orders', '/admin/orders')}
            {orders.data?.map((o) => (
              <StaffOrder key={o._id} order={o} onChange={orders.reload} />
            ))}
          </div>
        </div>
      )}
      {may('tickets') && (
        <div>
          <Label n={++n}>Tickets waiting on me</Label>
          <div className="mt-6 border-t border-rule">
            {tickets.error && <p className="body py-6">⚠ {tickets.error.message}</p>}
            {empty(tickets, 'tickets', '/admin/tickets')}
            {tickets.data?.map((t) => (
              <TicketRow key={t._id} t={t} />
            ))}
          </div>
          {answered.data?.length > 0 && (
            <details className="mt-6">
              <summary className="cursor-pointer text-sm text-muted">
                Replied, waiting on the customer ({answered.data.length})
              </summary>
              <div className="mt-3 border-t border-rule">
                {answered.data.map((t) => (
                  <TicketRow key={t._id} t={t} />
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
