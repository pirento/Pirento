// The customer's own requests across every product: search by subject or product, open and closed apart.
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {getProduct} from '@pirento/shared';
import {Tag} from '../../components/ui/Tag';
import {support as copy} from '../../data/site';
import {STATUS} from './status';
import {formatDate} from '../../lib/format';

const productName = (t) => getProduct(t.product ?? '')?.name ?? copy.general;

export function TicketList({tickets}) {
  const [q, setQ] = useState('');
  const query = q.trim().toLowerCase();
  const shown = (tickets ?? []).filter(
    (t) => !query || `${t.subject} ${productName(t)} ${t.ticketNo}`.toLowerCase().includes(query),
  );
  const open = shown.filter((t) => t.status !== 'closed');
  const closed = shown.filter((t) => t.status === 'closed');
  const Row = ({t}) => (
    <li>
      <Link
        to={`/support/${t._id}`}
        className="flex items-center justify-between gap-4 border-b border-rule py-4 hover:border-ink"
      >
        <span className="min-w-0">
          <span className="block truncate font-medium">{t.subject}</span>
          <span className="text-xs text-muted">
            #{t.ticketNo} · {productName(t)}
            {t.priority === 'high' && ' · high priority'} · {formatDate(t.updatedAt)}
          </span>
        </span>
        <Tag tone={t.status === 'answered' ? 'accent' : 'rule'}>{STATUS[t.status]}</Tag>
      </Link>
    </li>
  );
  return (
    <div>
      <label className="block">
        <span className="sr-only">Search your requests</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by subject, product or number"
          className="block w-full rounded-full border border-rule bg-paper px-5 py-3 outline-none focus:border-ink"
        />
      </label>
      {tickets && shown.length === 0 && (
        <p className="mt-6 text-muted">{tickets.length ? 'Nothing matches.' : 'No requests yet.'}</p>
      )}
      {open.length > 0 && (
        <ul className="mt-6 border-t border-rule">
          {open.map((t) => (
            <Row key={t._id} t={t} />
          ))}
        </ul>
      )}
      {closed.length > 0 && (
        <details className="mt-8">
          <summary className="cursor-pointer text-sm text-muted">Closed ({closed.length})</summary>
          <ul className="mt-3 border-t border-rule">
            {closed.map((t) => (
              <Row key={t._id} t={t} />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
