// Ask to take wallet money out to a UPI ID, and see the latest request's state.
import {useState} from 'react';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {inr} from '../../lib/format';

const STATE = {requested: 'Waiting for our team', paid: 'Sent', rejected: 'Returned to your wallet'};

export function Withdraw({balance, onDone}) {
  const list = useApi('/wallet/withdrawals');
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [upi, setUpi] = useState('');
  const [error, setError] = useState('');
  const latest = list.data?.[0];
  const waiting = latest?.status === 'requested';

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api('/wallet/withdrawals', {method: 'POST', body: {amount: Number(amount), upi}});
      setOpen(false);
      list.reload();
      onDone();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="mt-8 border-t border-rule pt-6">
      {latest && (
        <p className="text-sm text-muted" aria-live="polite">
          Last withdrawal: {inr(latest.amount / 100)} to {latest.upi} · {STATE[latest.status]}
          {latest.utr && ` · UTR ${latest.utr}`}
          {latest.reason && ` · ${latest.reason}`}
        </p>
      )}
      {!open && !waiting && balance >= 10000 && (
        <Button variant="outline" icon={null} className="mt-4" onClick={() => setOpen(true)}>
          Withdraw to UPI
        </Button>
      )}
      {open && (
        <form onSubmit={submit} className="mt-4 grid gap-4">
          <Field
            label="Amount (₹, at least 100)"
            type="number"
            min="100"
            max={balance / 100}
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Field
            label="UPI ID"
            required
            placeholder="name@bank"
            value={upi}
            onChange={(e) => setUpi(e.target.value)}
            error={error}
          />
          <p className="text-xs text-muted">
            The amount leaves your wallet now. Our team sends it and adds the bank reference (UTR) here; if it cannot be
            sent, the money comes back.
          </p>
          <div className="flex gap-3">
            <Button type="submit" variant="accent">
              Ask to withdraw
            </Button>
            <Button type="button" variant="outline" icon={null} onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
