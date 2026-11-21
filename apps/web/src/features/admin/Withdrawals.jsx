// Withdrawals: send the money by UPI, then mark it paid with the UTR, or return it to the wallet.
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {Button} from '../../components/ui/Button';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {formatDate, inr} from '../../lib/format';
import {StaffQueue} from './StaffQueue';

const FILTERS = [
  {label: 'To pay', value: 'requested'},
  {label: 'Sending', value: 'processing'},
  {label: 'Paid', value: 'paid'},
  {label: 'Returned', value: 'rejected'},
];

function Row({w, onChange, api: viaApi}) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const decide = async (decision) => {
    const ask =
      decision === 'paid'
        ? `Mark ${inr(w.amount / 100)} to ${w.upi} as sent, UTR ${text}?`
        : `Return ${inr(w.amount / 100)} to ${w.email}'s wallet?`;
    if (text.trim() && !confirm(ask)) return;
    setError('');
    setBusy(true);
    try {
      await api(`/wallet/staff/withdrawals/${w._id}`, {
        method: 'PATCH',
        body: decision === 'paid' ? {decision, utr: text} : {decision, reason: text},
      });
      onChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  // Through RazorpayX: the server claims the request first, so a second click is refused, not paid twice.
  const payout = async (action) => {
    if (action === 'payout' && !confirm(`Send ${inr(w.amount / 100)} to ${w.upi} through RazorpayX now?`)) return;
    setError('');
    setBusy(true);
    try {
      const after = await api(`/wallet/staff/withdrawals/${w._id}/${action}`, {method: 'POST'});
      if (after?.payout?.error && after.status !== 'paid') setError(after.payout.error);
      onChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
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
          {w.payout?.status && ` · RazorpayX: ${w.payout.status}`}
          {w.payout?.error && ` · ${w.payout.error}`}
        </p>
        {error && (
          <p role="alert" className="mt-2 text-sm">
            ⚠ {error}
          </p>
        )}
      </div>
      {w.status === 'processing' && (
        <Button variant="outline" icon={null} disabled={busy} onClick={() => payout('check')}>
          Check again
        </Button>
      )}
      {w.status === 'requested' && (
        <div className="flex flex-wrap items-center gap-2">
          {viaApi && (
            <Button variant="accent" icon={null} disabled={busy} onClick={() => payout('payout')}>
              Send by RazorpayX
            </Button>
          )}
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
          <Button variant={viaApi ? 'outline' : 'accent'} icon={null} disabled={busy} onClick={() => decide('paid')}>
            Mark paid
          </Button>
          <Button variant="outline" icon={null} disabled={busy} onClick={() => decide('rejected')}>
            Return
          </Button>
        </div>
      )}
    </div>
  );
}

export function Withdrawals() {
  const cfg = useApi('/wallet/staff/payouts/config');
  return (
    <StaffQueue
      path="/wallet/staff/withdrawals"
      filters={FILTERS}
      render={(w, reload) => <Row key={w._id} w={w} onChange={reload} api={cfg.data?.enabled} />}
    />
  );
}
