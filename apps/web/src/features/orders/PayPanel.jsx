// Pay for an order from the wallet or by card/UPI (Razorpay).
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {CreditCard, Wallet, X} from 'lucide-react';
import {Button} from '../../components/ui/Button';
import {Label} from '../../components/ui/Heading';
import {loadRazorpay} from './razorpay';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {inr} from '../../lib/format';

export function PayPanel({order, onPaid}) {
  const wallet = useApi('/wallet');
  const config = useApi('/orders/config');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const balance = wallet.data?.balance ?? 0;
  const short = balance < order.amount;

  const run = async (kind, fn) => {
    setBusy(kind);
    setError('');
    try {
      await fn();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };
  const payWallet = () =>
    run('wallet', async () => onPaid(await api(`/orders/${order._id}/pay/wallet`, {method: 'POST'})));
  const payRazorpay = () =>
    run('razorpay', async () => {
      const [Razorpay, p] = await Promise.all([
        loadRazorpay(),
        api(`/orders/${order._id}/pay/razorpay`, {method: 'POST'}),
      ]);
      await new Promise((resolve, reject) => {
        const rzp = new Razorpay({
          key: p.keyId,
          order_id: p.razorpayOrderId,
          amount: p.amount,
          currency: 'INR',
          name: 'Pirento',
          description: order.serviceName,
          prefill: {email: p.email, contact: order.intake.phone},
          theme: {color: getComputedStyle(document.documentElement).getPropertyValue('--inverse').trim()},
          handler: (res) =>
            api(`/orders/${order._id}/pay/razorpay/verify`, {method: 'POST', body: res})
              .then(onPaid)
              .then(resolve, reject),
          modal: {ondismiss: () => resolve()},
        });
        rzp.on('payment.failed', (r) => reject(new Error(r.error?.description ?? 'Payment failed')));
        rzp.open();
      });
    });
  const cancel = () => run('cancel', async () => onPaid(await api(`/orders/${order._id}/cancel`, {method: 'POST'})));

  return (
    <div className="rounded-[22px] border border-accent p-8" data-reveal>
      <Label n={1}>Pay</Label>
      <p className="num mt-6">{inr(order.amount / 100)}</p>
      {order.discount > 0 && (
        <p className="mt-2 text-sm text-muted">
          {order.coupon} took {inr(order.discount / 100)} off
        </p>
      )}
      <div className="mt-8 space-y-3">
        <Button
          onClick={payWallet}
          variant="accent"
          icon={Wallet}
          className="w-full justify-center"
          disabled={Boolean(busy) || short}
        >
          {busy === 'wallet' ? 'Paying' : 'Pay from wallet'}
        </Button>
        <p className="text-sm text-muted">
          Wallet balance {inr(balance / 100)}
          {short && (
            <>
              {' · '}
              <Link to="/dashboard" className="text-ink underline underline-offset-4">
                Add money
              </Link>
            </>
          )}
        </p>
        {config.data?.razorpayKeyId ? (
          <Button
            onClick={payRazorpay}
            variant="outline"
            icon={CreditCard}
            className="w-full justify-center"
            disabled={Boolean(busy)}
          >
            {busy === 'razorpay' ? 'Opening' : 'Pay by card or UPI'}
          </Button>
        ) : (
          <p className="text-sm text-muted">Card and UPI payments are expected soon.</p>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm">
          ⚠ {error}
        </p>
      )}
      <button
        onClick={cancel}
        disabled={Boolean(busy)}
        className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        <X aria-hidden className="size-4" /> Cancel order
      </button>
    </div>
  );
}
