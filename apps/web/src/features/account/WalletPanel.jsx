// The shared wallet: balance, test top-up, and the latest transactions.
import {useState} from 'react';
import {ArrowDownLeft, ArrowUpRight} from 'lucide-react';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {Label} from '../../components/ui/Heading';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {formatDate, inr} from '../../lib/format';

export function WalletPanel({n}) {
  const wallet = useApi('/wallet');
  const [amount, setAmount] = useState('500');
  const [error, setError] = useState('');

  const topUp = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api('/wallet/topup', {method: 'POST', body: {amount: Number(amount)}});
      wallet.reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const transactions = wallet.data?.transactions ?? [];
  return (
    <div className="rounded-[22px] border border-rule p-8" data-reveal>
      <Label n={n}>Wallet</Label>
      <p className="num mt-6 text-[clamp(2.5rem,5vw,4rem)]!" aria-live="polite">
        {wallet.data ? inr(wallet.data.balance / 100) : '—'}
      </p>
      <form onSubmit={topUp} className="mt-6 flex items-end gap-3">
        <div className="flex-1">
          <Field
            label="Test top-up (₹)"
            type="number"
            min="1"
            max="100000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={error}
          />
        </div>
        <Button type="submit" variant="outline" className="mb-px">
          Add
        </Button>
      </form>
      <p className="mt-3 text-xs text-muted">Test money only, until card and UPI top-ups go live.</p>

      <ul className="mt-8">
        {transactions.slice(0, 6).map((t) => (
          <li key={t._id} className="flex items-center justify-between gap-4 border-b border-rule py-3">
            <span className="flex min-w-0 items-center gap-3">
              {t.type === 'credit' ? (
                <ArrowDownLeft aria-hidden className="size-4 shrink-0" />
              ) : (
                <ArrowUpRight aria-hidden className="size-4 shrink-0" />
              )}
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{t.note || t.type}</span>
                <span className="text-xs text-muted">{formatDate(t.createdAt)}</span>
              </span>
            </span>
            <span className="shrink-0 text-sm tabular-nums">
              {t.type === 'credit' ? '+' : '−'}
              {inr(t.amount / 100)}
            </span>
          </li>
        ))}
      </ul>
      {wallet.data && transactions.length === 0 && <p className="mt-6 text-sm text-muted">No transactions yet.</p>}
    </div>
  );
}
