// Capital waitlist: people who asked to hear when lending opens (kept as support tickets).
import {Link} from 'react-router-dom';
import {useApi} from '../../lib/api/useApi';
import {formatDate} from '../../lib/format';
import {DataTable} from './DataTable';

export function Waitlist() {
  const list = useApi(`/support/staff/subject?q=${encodeURIComponent('Capital waitlist')}`);
  return (
    <DataTable
      error={list.error}
      rows={list.data}
      empty="Nobody on the waitlist yet."
      columns={[
        {label: 'Joined', cell: (t) => formatDate(t.createdAt)},
        {label: 'Email', cell: (t) => t.email},
        {label: 'What they need', cell: (t) => <span className="line-clamp-3">{t.messages?.[0]?.body}</span>},
        {
          label: 'Ticket',
          cell: (t) => (
            <Link to={`/support/${t._id}`} className="hover:underline">
              #{t.ticketNo}
            </Link>
          ),
        },
      ]}
    />
  );
}
