// Partners: Pirento One codes and what each brought in.
import {Link} from 'react-router-dom';
import {useApi} from '../../lib/api/useApi';
import {formatDate, inr} from '../../lib/format';
import {DataTable} from './DataTable';

export function Partners() {
  const partners = useApi('/orders/staff/partners');
  return (
    <div className="space-y-6">
      <p className="body">Tracking only: commission payouts are not built yet, so no money moves to partners.</p>
      <DataTable
        error={partners.error}
        rows={partners.data}
        rowKey={(p) => p.code}
        empty="No partners yet."
        columns={[
          {label: 'Code', cell: (p) => <span className="font-medium">{p.code}</span>},
          {
            label: 'Account',
            cell: (p) => (
              <Link to={`/admin/users/${p.userId}`} className="hover:underline">
                Open account
              </Link>
            ),
          },
          {label: 'Orders', right: true, cell: (p) => p.orders},
          {label: 'Paid value', right: true, cell: (p) => inr(p.paid / 100)},
          {label: 'Joined', right: true, cell: (p) => formatDate(p.joinedAt)},
        ]}
      />
    </div>
  );
}
