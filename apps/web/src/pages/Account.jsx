import {useRef, useState} from 'react';
import {Navigate, useNavigate, useSearchParams} from 'react-router-dom';
import {ArrowDownLeft, ArrowUpRight, LogOut} from 'lucide-react';
import {api, inr, useApi, useSession} from '../lib/api';
import {usePageMotion} from '../lib/motion';
import {usePageMeta} from '../lib/page';
import {Button, Field, Heading, Label, Section} from '../components/ui';
import {OrdersList} from './Orders';

export function Login() {
  const {user, signIn} = useSession();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // Only same-site paths, never an open redirect.
  const next = /^\/(?!\/)/.test(params.get('next') ?? '') ? params.get('next') : '/account';
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);
  usePageMotion(ref);
  usePageMeta({title: 'Sign in — Pirento'});
  if (user) return <Navigate to={next} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (step === 'email') {
        const res = await api('/auth/otp/request', {method: 'POST', body: {email}});
        setDevCode(res.devCode ?? '');
        setStep('code');
      } else {
        const res = await api('/auth/otp/verify', {method: 'POST', body: {email, code}});
        signIn(res.token, res.user);
        navigate(next);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={ref} className="hero relative min-h-dvh overflow-hidden pt-36 pb-28">
      <div aria-hidden className="grid-bg absolute inset-0" />
      <div className="container-x relative grid gap-14 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <p className="eyebrow" data-hero-fade>
            Sign in
          </p>
          <Heading as="h1" text="One code. / Every product." hl="Every product." className="h-hero mt-6" />
          <p className="body mt-8" data-hero-fade>
            Enter your email and we send a 6-digit code. <strong>No password to remember</strong>, and the same account
            works across Pirento.
          </p>
        </div>
        <form
          onSubmit={submit}
          noValidate
          className="rounded-[22px] border border-rule bg-paper p-8 lg:col-span-5 lg:col-start-8"
          data-hero-fade
        >
          {step === 'email' ? (
            <Field
              label="Email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
            />
          ) : (
            <>
              <p className="mb-6 text-sm text-muted">
                We sent a code to <span className="text-ink">{email}</span>.{' '}
                <button type="button" className="underline underline-offset-4" onClick={() => setStep('email')}>
                  Change
                </button>
              </p>
              <Field
                label="6-digit code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                error={error}
              />
              {devCode && (
                <p className="mt-3 text-sm text-muted">
                  Test mode code: <span className="text-ink tabular-nums">{devCode}</span>
                </p>
              )}
            </>
          )}
          <Button type="submit" variant="accent" className="mt-8 w-full justify-center" disabled={busy}>
            {busy ? 'Please wait' : step === 'email' ? 'Send code' : 'Sign in'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export function Account() {
  const {user, ready, signOut} = useSession();
  const wallet = useApi(user ? '/wallet' : null);
  const [amount, setAmount] = useState('500');
  const [msg, setMsg] = useState('');
  const ref = useRef(null);
  usePageMotion(ref, [ready]);
  usePageMeta({title: 'Your account — Pirento'});
  if (ready && !user) return <Navigate to="/login" replace />;
  if (!user) return <div className="min-h-dvh" />;

  const topUp = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await api('/wallet/topup', {method: 'POST', body: {amount: Number(amount)}});
      wallet.reload();
    } catch (err) {
      setMsg(err.message);
    }
  };

  return (
    <div ref={ref}>
      <section className="hero pt-36 pb-12 md:pt-44">
        <div className="container-x flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow" data-hero-fade>
              Account
            </p>
            <Heading as="h1" text={`Hello, / ${user.name || user.email.split('@')[0]}.`} className="h-hero mt-6" />
          </div>
          {['staff', 'superadmin'].includes(user.role) && (
            <Button to="/staff" data-hero-fade>
              Work queue
            </Button>
          )}
          <Button onClick={signOut} variant="outline" icon={LogOut} data-hero-fade>
            Sign out
          </Button>
        </div>
      </section>
      <Section className="pt-0! md:pt-0!">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="rounded-[22px] border border-rule p-8 lg:col-span-5" data-reveal>
            <Label n={1}>Wallet</Label>
            <p className="num mt-8 text-[clamp(2.5rem,5vw,4rem)]!" aria-live="polite">
              {wallet.data ? inr(wallet.data.balance / 100) : '—'}
            </p>
            {wallet.error && (
              <p role="alert" className="mt-3 text-sm">
                ⚠ {wallet.error.message}
              </p>
            )}
            <form onSubmit={topUp} className="mt-8 flex items-end gap-3">
              <div className="flex-1">
                <Field
                  label="Test top-up (₹)"
                  type="number"
                  min="1"
                  max="100000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  error={msg}
                />
              </div>
              <Button type="submit" variant="outline" className="mb-px">
                Add
              </Button>
            </form>
            <p className="mt-3 text-xs text-muted">Test money only, until card and UPI top-ups go live.</p>
          </div>
          <div className="rounded-[22px] border border-rule p-8 lg:col-span-7" data-reveal>
            <Label n={2}>Orders</Label>
            <OrdersList />
            <div className="mt-12">
              <Label n={3}>Transactions</Label>
            </div>
            {wallet.data?.transactions.length ? (
              <ul className="mt-6">
                {wallet.data.transactions.map((t) => (
                  <li key={t._id} className="flex items-center justify-between gap-4 border-b border-rule py-4">
                    <span className="flex items-center gap-3">
                      {t.type === 'credit' ? (
                        <ArrowDownLeft aria-hidden className="size-4" />
                      ) : (
                        <ArrowUpRight aria-hidden className="size-4" />
                      )}
                      <span>
                        <span className="block font-medium">
                          {t.note || (t.type === 'credit' ? 'Credit' : 'Debit')}
                        </span>
                        <span className="text-xs text-muted">{new Date(t.createdAt).toLocaleString('en-IN')}</span>
                      </span>
                    </span>
                    <span className="tabular-nums">
                      {t.type === 'credit' ? '+' : '−'}
                      {inr(t.amount / 100)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="body mt-6">No transactions yet.</p>
            )}
          </div>
        </div>
      </Section>
    </div>
  );
}
