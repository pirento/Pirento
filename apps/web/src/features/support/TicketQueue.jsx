// Staff queue of support tickets.
import {Link} from 'react-router-dom';
import {getProduct} from '@pirento/shared';
import {Tag} from '../../components/ui/Tag';
import {StaffQueue} from '../admin/StaffQueue';
import {STATUS} from './status';
import {formatDate} from '../../lib/format';

/** One ticket in a staff list: number, subject, who, product, priority and status. */
export const TicketRow = ({t}) => (
  <Link
    to={`/support/${t._id}`}
    className="flex flex-wrap items-center justify-between gap-4 border-b border-rule py-5 hover:border-ink"
  >
    <span>
      <span className="block font-medium">
        #{t.ticketNo} · {t.subject}
      </span>
      <span className="text-sm text-muted">
        {t.email} · {getProduct(t.product ?? '')?.short ?? 'Account'} · {formatDate(t.updatedAt)}
      </span>
    </span>
    <span className="flex items-center gap-2">
      {t.priority === 'high' && <Tag tone="accent">High priority</Tag>}
      <Tag>{STATUS[t.status]}</Tag>
    </span>
  </Link>
);

export const TicketQueue = () => (
  <StaffQueue
    path="/support/staff/queue"
    filters={[
      {label: 'Waiting on us', value: 'open'},
      {label: 'Mine', value: 'mine=1&status=open'},
      {label: 'Replied', value: 'answered'},
      {label: 'Closed', value: 'closed'},
    ]}
    byProduct={{none: 'Account and wallet'}}
    render={(t) => <TicketRow key={t._id} t={t} />}
  />
);
