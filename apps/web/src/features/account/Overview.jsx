// Dashboard top strip: wallet, open orders, Bharat ID and certificates, at a glance.
import {Link} from 'react-router-dom';
import {formatBharatId} from '@pirento/shared';
import {inr} from '../../lib/format';

const ID_STATUS = {draft: 'Started', submitted: 'In review', rejected: 'Needs a change'};

export function Overview({data}) {
  const open = data.orders?.filter((o) => ['pending_payment', 'paid', 'in_progress'].includes(o.status)).length;
  const id = data.identity;
  const tiles = [
    {label: 'Wallet', value: data.wallet ? inr(data.wallet.balance / 100) : '—', to: '#wallet'},
    {label: 'Open orders', value: open ?? '—', to: '#orders'},
    {
      label: 'Bharat ID',
      value:
        id === null ? 'Not started' : id ? (id.bharatId ? formatBharatId(id.bharatId) : ID_STATUS[id.status]) : '—',
      to: '/bharat-id/dashboard',
    },
    {label: 'Certificates', value: data.learning?.certificates.length ?? '—', to: '/intern/dashboard'},
  ];
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[22px] border border-rule bg-rule lg:grid-cols-4">
      {tiles.map((t) => (
        <Link
          key={t.label}
          to={t.to}
          className="group bg-paper p-6 transition-colors hover:bg-stone md:p-7"
          data-reveal
        >
          <dt className="eyebrow">{t.label}</dt>
          <dd className="num mt-6 text-[clamp(1.25rem,2.6vw,2.4rem)]! leading-tight break-words">{t.value}</dd>
        </Link>
      ))}
    </dl>
  );
}
