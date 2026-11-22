// The strip at the top of every business console page: which company, test or live, and the credit left.
import {Link} from 'react-router-dom';
import {Tag} from '../../components/ui/Tag';
import {useApi} from '../../lib/api/useApi';
import {inr} from '../../lib/format';

const STATUS = {test: 'Test mode', live_review: 'Live in review', live: 'Live', suspended: 'Suspended'};

export function Console({business}) {
  const wallet = useApi('/wallet');
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[18px] border border-rule px-4 py-3 text-sm">
      <span className="font-medium">{business.profile?.legalName ?? business.request.company}</span>
      <Tag tone={business.status === 'live' ? 'accent' : 'rule'}>{STATUS[business.status] ?? business.status}</Tag>
      <Link to="/bharat-id/business/dashboard/billing" className="tabular-nums underline-offset-4 hover:underline">
        Credit {wallet.data ? inr(wallet.data.balance / 100) : '…'}
      </Link>
    </div>
  );
}
