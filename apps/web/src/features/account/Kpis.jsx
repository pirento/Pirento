// Four numbers beside the wallet, each with an icon and the line that explains it.
import {Link} from 'react-router-dom';
import {Award, Fingerprint, Package, Receipt} from 'lucide-react';
import {formatBharatId} from '@pirento/shared';
import {inr} from '../../lib/format';
import {spent} from './useDashboardData';

const ID_STATUS = {draft: 'Started', submitted: 'In review', rejected: 'Needs a change'};

export function Kpis({data}) {
  const {orders, identity, learning} = data;
  const open = orders?.filter((o) => ['pending_payment', 'paid', 'in_progress'].includes(o.status));
  const month = new Date().toISOString().slice(0, 7);
  const thisMonth = spent(orders).filter((o) => o.createdAt.slice(0, 7) === month);
  const tiles = [
    {
      icon: Package,
      label: 'Open orders',
      value: open ? open.length : '—',
      note: open?.length ? `${open.filter((o) => o.status === 'pending_payment').length} to pay` : 'None open',
      to: '#activity',
    },
    {
      icon: Receipt,
      label: 'Spent this month',
      value: orders ? inr(thisMonth.reduce((s, o) => s + o.amount, 0) / 100) : '—',
      note: `${thisMonth.length} paid order${thisMonth.length === 1 ? '' : 's'}`,
      to: '#spend',
    },
    {
      icon: Fingerprint,
      label: 'Bharat ID',
      value:
        identity === null
          ? 'Not started'
          : identity
            ? identity.bharatId
              ? formatBharatId(identity.bharatId)
              : ID_STATUS[identity.status]
            : '—',
      note: identity?.bharatId ? 'Issued' : 'One identity everywhere',
      to: '/bharat-id/dashboard',
    },
    {
      icon: Award,
      label: 'Certificates',
      value: learning ? learning.certificates.length : '—',
      note: 'Pirento Intern',
      to: '/intern/dashboard',
    },
  ];
  return (
    <ul className="grid h-full grid-cols-2 gap-3">
      {tiles.map((t) => (
        <li key={t.label}>
          <Link
            to={t.to}
            className="group flex h-full flex-col rounded-[18px] border border-rule p-5 transition-colors hover:border-ink"
            data-reveal
          >
            <span className="flex items-center justify-between text-muted">
              <span className="text-sm">{t.label}</span>
              <t.icon aria-hidden className="size-4" />
            </span>
            <span className="num mt-5 text-[clamp(1.35rem,2.4vw,2.1rem)]! leading-tight break-words">{t.value}</span>
            <span className="mt-1 text-xs text-muted">{t.note}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
