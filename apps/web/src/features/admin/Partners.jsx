// Partners: Pirento One codes, what each brought in, and the commission paid or still owed.
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {Button} from '../../components/ui/Button';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {formatDate, inr} from '../../lib/format';
import {DataTable} from './DataTable';

export function Partners() {
  const partners = useApi('/orders/staff/partners');
  const pct = useApi('/catalog/settings').data?.commissionPct ?? 0;
  const [note, setNote] = useState('');
  const owed = (partners.data ?? []).reduce((n, p) => n + p.owed, 0);

  const payOwed = async () => {
    setNote('');
    try {
      const {paid, left} = await api('/orders/staff/partners/pay-owed', {method: 'POST'});
      setNote(`Sent ${paid}.${left ? ` ${left} could not be sent; try again in a while.` : ''}`);
      partners.reload();
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <p className="body">
        Commission: {pct}% of each completed order, paid to the partner's wallet. A superadmin sets the rate in Site
        settings.
      </p>
      {owed > 0 && (
        <div className="flex flex-wrap items-center gap-4">
          <p className="text-sm">{inr(owed / 100)} in commission did not reach a wallet when its order completed.</p>
          <Button variant="outline" onClick={payOwed}>
            Send owed commission
          </Button>
        </div>
      )}
      {note && (
        <p role="status" className="text-sm">
          {note}
        </p>
      )}
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
          {label: 'Commission paid', right: true, cell: (p) => inr(p.earned / 100)},
          {label: 'Owed', right: true, cell: (p) => (p.owed ? inr(p.owed / 100) : '—')},
          {label: 'Joined', right: true, cell: (p) => formatDate(p.joinedAt)},
        ]}
      />
    </div>
  );
}
