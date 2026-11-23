// The shared wallet: balance, adding money (card/UPI, or test money in development), and the latest transactions.
import {useState} from 'react';
import {ArrowDownLeft, ArrowUpRight} from 'lucide-react';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {Label} from '../../components/ui/Heading';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {formatDate, inr} from '../../lib/format';
import {Withdraw} from './Withdraw';
import {loadRazorpay} from '../orders/razorpay';
import {useSession} from '../../lib/api/session';

export function WalletPanel({n, full = false}) {
  const wallet = useApi('/wallet');
  const options = useApi('/wallet/topup/config');
  const {user} = useSession();
  const [amount, setAmount] = useState('500');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const card = options.data?.razorpayKeyId;
  const test = !card && options.data?.testTopup;

  // Card/UPI: the server fixes the amount and opens a Razorpay order; the wallet is credited only once the
  // server has checked Razorpay's signature (or its webhook arrives).
  const payByCard = async () => {
    const [Razorpay, p] = await Promise.all([
      loadRazorpay(),
      api('/wallet/topup/razorpay', {method: 'POST', body: {amount: Number(amount)}}),
    ]);
    await new Promise((resolve, reject) => {
      const rzp = new Razorpay({
        key: p.keyId,
        order_id: p.razorpayOrderId,
        amount: p.amount,
        currency: 'INR',
        name: 'Pirento',
        description: 'Add money to wallet',
        prefill: {email: user?.email, contact: user?.phone},
        theme: {color: getComputedStyle(document.documentElement).getPropertyValue('--inverse').trim()},
        handler: (res) => api('/wallet/topup/razorpay/verify', {method: 'POST', body: res}).then(resolve, reject),
        modal: {ondismiss: () => resolve()},
      });
      rzp.on('payment.failed', (r) => reject(new Error(r.error?.description ?? 'Payment failed')));
      rzp.open();
    });
  };

  const topUp = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (card) await payByCard();
      else await api('/wallet/topup', {method: 'POST', body: {amount: Number(amount)}});
      wallet.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const transactions = wallet.data?.transactions ?? [];
  return (
    <div className="rounded-[22px] border border-rule p-8" data-reveal>
      <Label n={n}>Wallet</Label>
      <p className="num mt-6 text-[clamp(2.5rem,5vw,4rem)]!" aria-live="polite">
        {wallet.data ? inr(wallet.data.balance / 100) : '—'}
      </p>
      {card || test ? (
        <form id="add" onSubmit={topUp} className="mt-6 flex scroll-mt-24 items-end gap-3">
          <div className="flex-1">
            <Field
              label={card ? 'Add money (₹)' : 'Test top-up (₹)'}
              type="number"
              min="1"
              max="100000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              error={error}
            />
          </div>
          <Button type="submit" variant="outline" className="mb-px" disabled={busy}>
            {busy ? 'Opening' : 'Add'}
          </Button>
        </form>
      ) : (
        options.data && <p className="mt-6 text-sm text-muted">Card and UPI top-ups are expected soon.</p>
      )}
      <p className="mt-3 text-xs text-muted">
        {card
          ? 'By card or UPI through Razorpay. Your wallet updates once the payment is confirmed.'
          : test
            ? 'Test money only, until card and UPI top-ups go live.'
            : ''}
      </p>

      <div id="withdraw" className="scroll-mt-24">
        <Withdraw balance={wallet.data?.balance ?? 0} onDone={wallet.reload} />
      </div>

      <ul className="mt-8">
        {transactions.slice(0, full ? 50 : 6).map((t) => (
          <li key={t._id} className="flex items-center justify-between gap-4 border-b border-rule py-3">
            <span className="flex min-w-0 items-center gap-3">
              {t.type === 'credit' ? (
                <ArrowDownLeft aria-hidden className="size-4 shrink-0" />
              ) : (
                <ArrowUpRight aria-hidden className="size-4 shrink-0" />
              )}
              <span className="min-w-0">
                <span className="block text-sm font-medium break-words">{t.note || t.type}</span>
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
