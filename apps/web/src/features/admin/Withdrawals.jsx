// Withdrawals: send the money by UPI, then mark it paid with the UTR, or return it to the wallet.
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {Button} from '../../components/ui/Button';
import {api} from '../../lib/api/client';
import {formatDate, inr} from '../../lib/format';
import {StaffQueue} from './StaffQueue';

const FILTERS = [
  {label: 'To pay', value: 'requested'},
  {label: 'Paid', value: 'paid'},
  {label: 'Returned', value: 'rejected'},
];

function Row({w, onChange}) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const decide = async (decision) => {
    setError('');
    try {
      await api(`/wallet/staff/withdrawals/${w._id}`, {
        method: 'PATCH',
        body: decision === 'paid' ? {decision, utr: text} : {decision, reason: text},
      });
      onChange();
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <div className="grid gap-4 border-b border-rule py-5 md:grid-cols-[1fr_auto] md:items-center">
      <div className="min-w-0">
        <p className="font-medium">
          {inr(w.amount / 100)} → <span className="break-all">{w.upi}</span>
        </p>
        <p className="text-sm text-muted">
          <Link to={`/admin/users/${w.userId}`} className="hover:underline">
            {w.email}
          </Link>{' '}
          · asked {formatDate(w.createdAt)}
          {w.utr && ` · UTR ${w.utr}`}
          {w.reason && ` · ${w.reason}`}
          {w.decidedBy && ` · by ${w.decidedBy}`}
        </p>
        {error && (
          <p role="alert" className="mt-2 text-sm">
            ⚠ {error}
          </p>
        )}
      </div>
      {w.status === 'requested' && (
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor={`wd-${w._id}`}>
            UTR, or the reason to return it
          </label>
          <input
            id={`wd-${w._id}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="UTR or reason"
            className="w-44 rounded-full border border-rule bg-paper px-4 py-2 text-sm outline-none focus:border-ink"
          />
          <Button variant="accent" icon={null} onClick={() => decide('paid')}>
            Mark paid
          </Button>
          <Button variant="outline" icon={null} onClick={() => decide('rejected')}>
            Return
          </Button>
        </div>
      )}
    </div>
  );
}

export const Withdrawals = () => (
  <StaffQueue
    path="/wallet/staff/withdrawals"
    filters={FILTERS}
    render={(w, reload) => <Row key={w._id} w={w} onChange={reload} />}
  />
);
