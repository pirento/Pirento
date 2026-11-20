// Payments: the wallet ledger across every account.
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {StatsRow} from '../../components/ui/Blocks';
import {useApi} from '../../lib/api/useApi';
import {formatDate, inr} from '../../lib/format';
import {DataTable} from './DataTable';

const TYPES = [
  {label: 'All', value: ''},
  {label: 'Money in', value: 'credit'},
  {label: 'Money out', value: 'debit'},
];

export function Payments() {
  const [type, setType] = useState('');
  const ledger = useApi(`/wallet/staff/transactions${type ? `?type=${type}` : ''}`);
  const d = ledger.data;
  return (
    <div className="space-y-8">
      <StatsRow
        stats={[
          {value: d ? inr(d.held / 100) : '—', label: 'held in wallets'},
          {value: String(d?.wallets ?? '—'), label: 'wallets'},
        ]}
      />
      <div role="tablist" aria-label="Filter" className="flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button
            key={t.label}
            role="tab"
            aria-selected={type === t.value}
            onClick={() => setType(t.value)}
            className={`rounded-full border px-4 py-2 text-sm ${type === t.value ? 'border-ink bg-ink text-paper' : 'border-rule hover:border-ink'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <DataTable
        error={ledger.error}
        rows={d?.transactions}
        empty="No wallet movements yet."
        columns={[
          {label: 'When', cell: (t) => formatDate(t.createdAt)},
          {
            label: 'Account',
            cell: (t) => (
              <Link to={`/admin/users/${t.userId}`} className="hover:underline">
                Open account
              </Link>
            ),
          },
          {label: 'Note', cell: (t) => t.note},
          {label: 'Amount', right: true, cell: (t) => `${t.type === 'debit' ? '−' : '+'}${inr(t.amount / 100)}`},
          {label: 'Balance after', right: true, cell: (t) => inr(t.balanceAfter / 100)},
        ]}
      />
    </div>
  );
}
