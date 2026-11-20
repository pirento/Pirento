// Staff queue of support tickets.
import {Link} from 'react-router-dom';
import {Tag} from '../../components/ui/Tag';
import {StaffQueue} from '../admin/StaffQueue';
import {STATUS} from './status';
import {formatDate} from '../../lib/format';

export const TicketQueue = () => (
  <StaffQueue
    path="/support/staff/queue"
    filters={[
      {label: 'Waiting on us', value: 'open'},
      {label: 'Replied', value: 'answered'},
      {label: 'Closed', value: 'closed'},
    ]}
    render={(t) => (
      <Link
        key={t._id}
        to={`/support/${t._id}`}
        className="flex flex-wrap items-center justify-between gap-4 border-b border-rule py-5 hover:border-ink"
      >
        <span>
          <span className="block font-medium">
            #{t.ticketNo} · {t.subject}
          </span>
          <span className="text-sm text-muted">
            {t.email} · {formatDate(t.updatedAt)}
          </span>
        </span>
        <Tag>{STATUS[t.status]}</Tag>
      </Link>
    )}
  />
);
