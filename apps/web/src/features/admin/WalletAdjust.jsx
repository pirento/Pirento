// A finance-only form on the user page: credit or debit a wallet with a reason.
import {useState} from 'react';
import {Button} from '../../components/ui/Button';
import {api} from '../../lib/api/client';

export function WalletAdjust({userId, onDone}) {
  const [type, setType] = useState('credit');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    if (!confirm(`${type === 'credit' ? 'Add' : 'Take'} ₹${amount} ${type === 'credit' ? 'to' : 'from'} this wallet?`))
      return;
    setError('');
    try {
      await api('/wallet/staff/adjust', {method: 'POST', body: {userId, type, amount: Number(amount), reason}});
      setAmount('');
      setReason('');
      onDone();
    } catch (err) {
      setError(err.message);
    }
  };
  const input = 'rounded-full border border-rule bg-paper px-4 py-2 text-sm outline-none focus:border-ink';
  return (
    <form onSubmit={submit} className="mt-6 flex flex-wrap gap-2">
      <label className="sr-only" htmlFor="adj-type">
        Credit or debit
      </label>
      <select id="adj-type" value={type} onChange={(e) => setType(e.target.value)} className={input}>
        <option value="credit">Credit</option>
        <option value="debit">Debit</option>
      </select>
      <label className="sr-only" htmlFor="adj-amount">
        Amount in rupees
      </label>
      <input
        id="adj-amount"
        type="number"
        min="1"
        required
        placeholder="₹"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className={`${input} w-24`}
      />
      <label className="sr-only" htmlFor="adj-reason">
        Reason
      </label>
      <input
        id="adj-reason"
        required
        minLength={3}
        placeholder="Reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className={`${input} min-w-0 flex-1 basis-40`}
      />
      <Button type="submit" variant="outline" icon={null}>
        Apply
      </Button>
      {error && (
        <p role="alert" className="w-full text-sm">
          ⚠ {error}
        </p>
      )}
    </form>
  );
}
