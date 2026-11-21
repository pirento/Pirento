// The hub's account numbers: the one wallet, your identity, open support requests and certificates ('—' while loading).
import {formatBharatId} from '@pirento/shared';
import {inr} from '../../lib/format';

const ID_STATUS = {draft: 'Started', submitted: 'In review', rejected: 'Needs a change'};

export function accountStats({wallet, identity, tickets, learning}) {
  const bharatId =
    identity === null
      ? 'Not yet'
      : identity && (identity.bharatId ? formatBharatId(identity.bharatId) : ID_STATUS[identity.status]);
  return [
    {label: 'Wallet balance', value: wallet ? inr(wallet.balance / 100) : '—'},
    {label: 'Bharat ID', value: bharatId ?? '—'},
    {
      label: 'Open support requests',
      value: tickets ? String(tickets.filter((t) => t.status !== 'closed').length) : '—',
    },
    {label: 'Certificates', value: learning ? String(learning.certificates.length) : '—'},
  ];
}
