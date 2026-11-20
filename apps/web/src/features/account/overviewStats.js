// The numbers at the top of the dashboard, worked out from your own records ('—' while they load).
import {formatBharatId} from '@pirento/shared';
import {inr} from '../../lib/format';
import {spent} from './useDashboardData';

const ID_STATUS = {draft: 'Started', submitted: 'In review', rejected: 'Needs a change'};

export function overviewStats({wallet, orders, identity, learning}) {
  const open = orders?.filter((o) => ['pending_payment', 'paid', 'in_progress'].includes(o.status));
  const month = new Date().toISOString().slice(0, 7);
  const thisMonth = spent(orders).filter((o) => o.createdAt.slice(0, 7) === month);
  const bharatId =
    identity === null
      ? 'Not yet'
      : identity && (identity.bharatId ? formatBharatId(identity.bharatId) : ID_STATUS[identity.status]);
  return [
    {label: 'Wallet balance', value: wallet ? inr(wallet.balance / 100) : '—'},
    {label: 'Open orders', value: open ? String(open.length) : '—'},
    {label: 'Spent this month', value: orders ? inr(thisMonth.reduce((s, o) => s + o.amount, 0) / 100) : '—'},
    {label: 'Bharat ID', value: bharatId ?? '—'},
    {label: 'Certificates', value: learning ? String(learning.certificates.length) : '—'},
  ];
}
