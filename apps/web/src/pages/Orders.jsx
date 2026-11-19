import {useRef, useState} from 'react';
import {Link, Navigate, useLocation, useNavigate, useParams} from 'react-router-dom';
import {BadgeCheck, CreditCard, Search, ShieldCheck, Wallet, X} from 'lucide-react';
import {QRCodeSVG} from 'qrcode.react';
import {
  ORDER_STEPS,
  STAFF_TRANSITIONS,
  checkoutQuestions,
  formatBharatId,
  getService,
  statusLabel,
} from '@pirento/shared';
import {IdentityQueue} from './BharatId';
import {TicketQueue} from './Support';
import {api, inr, useApi, useSession} from '../lib/api';
import {usePageMotion} from '../lib/motion';
import {usePageMeta} from '../lib/page';
import {Button, Field, Heading, Label, Section, Tag} from '../components/ui';
import {PageHero} from './Products';
import {NotFound} from './NotFound';

export const formatDate = (d) =>
  new Date(d).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

/** Sends signed-out visitors to /login and back here afterwards. */
export function useSignedIn() {
  const {user, ready} = useSession();
  const {pathname} = useLocation();
  if (ready && !user) return {redirect: <Navigate to={`/login?next=${encodeURIComponent(pathname)}`} replace />};
  return {user, ready};
}

const qty = (o) => (o.quantity > 1 ? ` × ${o.quantity}` : '');

// ── Checkout ─────────────────────────────────────────────────────────────

function Question({q, value, onChange}) {
  if (!q.options) {
    return (
      <Field
        label={q.label}
        required={Boolean(q.pattern)}
        placeholder={q.placeholder}
        inputMode={q.pattern ? 'numeric' : undefined}
        maxLength={q.pattern ? 10 : 500}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  if (q.options.length > 6) {
    return (
      <label className="block">
        <span className="text-sm font-medium">
          {q.label} <span className="text-muted">(required)</span>
        </span>
        {q.help && <span className="mt-1 block text-sm text-muted">{q.help}</span>}
        <select
          required
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="mt-2 block w-full rounded-[14px] border border-rule bg-paper px-4 py-3 text-base focus:border-ink"
        >
          <option value="" disabled>
            Choose one
          </option>
          {q.options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </label>
    );
  }
  return (
    <fieldset>
      <legend className="text-sm font-medium">
        {q.label} <span className="text-muted">(required)</span>
      </legend>
      {q.help && <p className="mt-1 text-sm text-muted">{q.help}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {q.options.map((o) => (
          <label
            key={o}
            className={`cursor-pointer rounded-full border px-4 py-2 text-sm transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 ${
              value === o ? 'border-ink bg-ink text-paper' : 'border-rule hover:border-ink'
            }`}
          >
            <input
              type="radio"
              name={q.id}
              value={o}
              checked={value === o}
              onChange={() => onChange(o)}
              className="sr-only"
            />
            {o}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Checkout() {
  const {slug} = useParams();
  const service = getService(slug);
  const navigate = useNavigate();
  const {redirect} = useSignedIn();
  const [answers, setAnswers] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);
  usePageMotion(ref, [slug]);
  usePageMeta({title: `Checkout · ${service?.name ?? ''} — Pirento`});
  if (!service?.price) return <NotFound />;
  if (redirect) return redirect;

  const questions = checkoutQuestions(service.product, service.slug);
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const order = await api('/orders', {method: 'POST', body: {serviceSlug: slug, quantity, intake: answers}});
      navigate(`/orders/${order._id}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div ref={ref}>
      <PageHero label="Checkout" title={`Tell us about / your ${service.product === 'black' ? 'filing' : 'matter'}.`} />
      <Section className="pt-0! md:pt-0!">
        <form onSubmit={submit} noValidate className="grid gap-10 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-7" data-reveal>
            {service.maxQty > 1 && (
              <Field
                label={`How many ${service.unit}s? (up to ${service.maxQty})`}
                type="number"
                min={1}
                max={service.maxQty}
                required
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(service.maxQty, Number(e.target.value) || 1)))}
              />
            )}
            {questions.map((q) => (
              <Question
                key={q.id}
                q={q}
                value={answers[q.id]}
                onChange={(v) => setAnswers((a) => ({...a, [q.id]: v}))}
              />
            ))}
          </div>
          <aside
            className="h-fit rounded-[22px] border border-accent p-8 lg:sticky lg:top-24 lg:col-span-5"
            data-reveal
          >
            <p className="eyebrow">{service.category}</p>
            <h2 className="mt-4 text-3xl">{service.name}</h2>
            <p className="mt-2 text-sm text-muted">{service.deliveryTime}</p>
            <div className="mt-8 flex items-baseline justify-between border-t border-rule pt-6">
              <span className="text-muted">
                {service.model === 'consult' ? 'Consultation' : 'Total'}
                {quantity > 1 && ` · ${quantity} × ${inr(service.price)}`}
              </span>
              <span className="num">{inr(service.price * quantity)}</span>
            </div>
            {error && (
              <p role="alert" className="mt-6 text-sm">
                ⚠ {error}
              </p>
            )}
            <Button type="submit" variant="accent" className="mt-8 w-full justify-center" disabled={busy}>
              {busy ? 'Placing order' : 'Continue to payment'}
            </Button>
            <p className="mt-4 flex items-center gap-2 text-xs text-muted">
              <ShieldCheck aria-hidden className="size-4" /> The price is set by Pirento, not by your browser.
            </p>
          </aside>
        </form>
      </Section>
    </div>
  );
}

// ── Order ────────────────────────────────────────────────────────────────

/** Vertical rail filled with accent up to the current step. */
export function Timeline({order}) {
  const cancelled = order.status === 'cancelled';
  const reached = ORDER_STEPS.findIndex((s) => s.status === order.status);
  const at = (status) => order.timeline.findLast((t) => t.status === status);
  const steps = cancelled
    ? [...order.timeline.map((t) => ({status: t.status, label: statusLabel(t.status)}))]
    : ORDER_STEPS;
  const current = cancelled ? steps.length - 1 : reached;

  return (
    <ol className="relative ml-2 border-l border-rule">
      <span
        aria-hidden
        className="absolute top-0 -left-px w-0.5 bg-accent transition-[height] duration-1000 ease-ui"
        style={{height: `${(current / Math.max(steps.length - 1, 1)) * 100}%`}}
      />
      {steps.map((s, i) => {
        const entry = cancelled ? order.timeline[i] : at(s.status);
        const state = i < current ? 'Done' : i === current ? 'Now' : 'Expected';
        return (
          <li key={`${s.status}-${i}`} className="relative pb-10 pl-8 last:pb-0" data-reveal>
            <span
              aria-hidden
              className={`absolute top-1.5 -left-[7px] size-3 rounded-full border-2 ${
                state === 'Expected' ? 'border-rule bg-paper' : 'border-accent bg-accent'
              }`}
            />
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-xl">{s.label}</h3>
              <Tag tone={state === 'Now' ? 'accent' : 'rule'}>{state}</Tag>
            </div>
            {entry && (
              <p className="mt-1 text-sm text-muted">
                {formatDate(entry.at)}
                {entry.note && ` · ${entry.note}`}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

const loadRazorpay = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(window.Razorpay);
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(window.Razorpay);
    s.onerror = () => reject(new Error('Could not load the payment window. Check your connection.'));
    document.head.append(s);
  });

function PayPanel({order, onPaid}) {
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
              <Link to="/account" className="text-ink underline underline-offset-4">
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

export function OrderPage() {
  const {id} = useParams();
  const {redirect, user} = useSignedIn();
  const {data: fetched, error, setData} = useOrder(user ? id : null);
  const ref = useRef(null);
  usePageMotion(ref, [Boolean(fetched)]);
  usePageMeta({title: fetched ? `Order #${fetched.orderNo} — Pirento` : 'Order — Pirento'});
  if (redirect) return redirect;
  if (error) return <NotFound />;
  if (!fetched) return <div className="min-h-dvh" />;
  const order = fetched;
  const questions = checkoutQuestions(order.product, order.serviceSlug);

  return (
    <div ref={ref}>
      <PageHero label={`Order #${order.orderNo}${qty(order)}`} title={order.serviceName}>
        <div className="mt-8 flex flex-wrap items-center gap-3" data-hero-fade>
          <Tag tone={order.status === 'completed' ? 'accent' : 'rule'}>{statusLabel(order.status)}</Tag>
          <span className="text-sm text-muted">Placed {formatDate(order.createdAt)}</span>
        </div>
      </PageHero>
      <Section className="pt-0! md:pt-0!">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Timeline order={order} />
            {order.code && (
              <div
                className="mt-12 flex flex-wrap items-center gap-4 rounded-[18px] border border-rule p-6"
                data-reveal
              >
                <BadgeCheck aria-hidden className="size-6" />
                <div>
                  <p className="text-sm text-muted">Completion code, anyone can check it</p>
                  <Link to={`/verify/${order.code}`} className="display text-2xl underline underline-offset-4">
                    {order.code}
                  </Link>
                </div>
              </div>
            )}
          </div>
          <div className="space-y-6 lg:col-span-5">
            {order.status === 'pending_payment' && <PayPanel order={order} onPaid={setData} />}
            <dl className="rounded-[22px] border border-rule p-8" data-reveal>
              <Label n={order.status === 'pending_payment' ? 2 : 1}>Your answers</Label>
              {questions
                .filter((q) => order.intake[q.id])
                .map((q) => (
                  <div key={q.id} className="mt-5 border-t border-rule pt-4">
                    <dt className="text-sm text-muted">{q.label}</dt>
                    <dd className="mt-1">{order.intake[q.id]}</dd>
                  </div>
                ))}
            </dl>
          </div>
        </div>
      </Section>
    </div>
  );
}

function useOrder(id) {
  const res = useApi(id ? `/orders/${id}` : null);
  const [override, setData] = useState(null);
  return {...res, data: override?._id === id ? override : res.data, setData};
}

export function OrdersList() {
  const {data} = useApi('/orders');
  if (!data?.length)
    return (
      <p className="body mt-6">
        No orders yet.{' '}
        <Link to="/legal" className="text-ink underline underline-offset-4">
          Browse services
        </Link>
      </p>
    );
  return (
    <ul className="mt-6">
      {data.map((o) => (
        <li key={o._id}>
          <Link
            to={`/orders/${o._id}`}
            className="flex items-center justify-between gap-4 border-b border-rule py-4 hover:border-ink"
          >
            <span>
              <span className="block font-medium">{o.serviceName}</span>
              <span className="text-xs text-muted">
                #{o.orderNo}
                {qty(o)} · {statusLabel(o.status)}
              </span>
            </span>
            <span className="tabular-nums">{inr(o.amount / 100)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

// ── Verify ───────────────────────────────────────────────────────────────

// Bharat IDs are 10 digits; certificates start PC-; everything else is an order code.
const verifyPath = (code) =>
  /^\d{10}$/.test(code)
    ? `/identity/verify/${code}`
    : code.startsWith('PC-')
      ? `/learning/verify/${code}`
      : `/orders/verify/${code}`;

function VerifiedCard({code, data}) {
  const rows = /^\d{10}$/.test(code)
    ? {
        title: data.name,
        lines: [`Bharat ID ${formatBharatId(data.bharatId)}`, `${data.state} · issued ${formatDate(data.issuedAt)}`],
      }
    : code.startsWith('PC-')
      ? {
          title: data.fullName,
          lines: [
            `${data.trackName} · scored ${data.percent}%`,
            `Theory ${data.skills?.theoretical ?? '—'}% · Practical ${data.skills?.practical ?? '—'}%`,
            `Issued ${formatDate(data.issuedAt)} · ${data.code}`,
          ],
        }
      : {title: data.serviceName, lines: [`Completed ${formatDate(data.completedAt)} · ${data.code}`]};
  return (
    <div className="flex max-w-2xl flex-wrap items-start justify-between gap-8 rounded-[22px] border border-accent p-8">
      <div>
        <p className="flex items-center gap-2 font-medium">
          <BadgeCheck aria-hidden className="size-5" /> Verified
        </p>
        <p className="display mt-6 text-3xl">{rows.title}</p>
        {rows.lines.map((l) => (
          <p key={l} className="mt-2 text-muted">
            {l}
          </p>
        ))}
      </div>
      <QRCodeSVG
        value={`https://pirento.com/verify/${code}`}
        size={112}
        bgColor="transparent"
        fgColor="currentColor"
        title={`QR code for verify link ${code}`}
      />
    </div>
  );
}

export function Verify() {
  const {code: raw} = useParams();
  const code = raw?.toUpperCase();
  const navigate = useNavigate();
  const [input, setInput] = useState(code ?? '');
  const result = useApi(code ? verifyPath(code) : null);
  const ref = useRef(null);
  usePageMotion(ref, [code]);
  usePageMeta({title: 'Verify a Pirento code', description: 'Check a Bharat ID, certificate or completion code.'});

  return (
    <div ref={ref}>
      <PageHero
        label="Verify"
        title="Check a / Pirento code."
        hl="Pirento code."
        intro="Enter a Bharat ID, an Intern certificate code (PC-…) or a completion code (LGL-, BLK-, GRN-…) to see if it is on our records."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const v = input.replace(/\s+/g, '').toUpperCase();
            if (v) navigate(`/verify/${v}`);
          }}
          className="mt-10 flex max-w-xl items-center gap-3 rounded-full border border-rule bg-paper py-2 pr-2 pl-5 focus-within:border-ink"
          data-hero-fade
        >
          <Search aria-hidden className="size-4 text-muted" />
          <label htmlFor="code" className="sr-only">
            Code
          </label>
          <input
            id="code"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="PC-1A2B3C4D or 10-digit ID"
            className="w-full bg-transparent uppercase outline-none placeholder:text-muted placeholder:normal-case"
          />
          <Button type="submit" className="px-5! py-2.5!">
            Check
          </Button>
        </form>
      </PageHero>
      {code && (
        <Section className="pt-0! md:pt-0!">
          <div aria-live="polite">
            {result.loading && <p className="body">Checking…</p>}
            {result.error && (
              <p className="body">
                <strong>Not found.</strong> {result.error.message}. Check for typos.
              </p>
            )}
            {result.data && <VerifiedCard code={code} data={result.data} />}
          </div>
        </Section>
      )}
    </div>
  );
}

// ── Staff ────────────────────────────────────────────────────────────────

const ACTION = {in_progress: 'Start work', completed: 'Mark completed', cancelled: 'Cancel'};
const FILTERS = [
  {label: 'Open', value: ''},
  {label: 'Paid', value: 'paid'},
  {label: 'In progress', value: 'in_progress'},
  {label: 'Unpaid', value: 'pending_payment'},
  {label: 'Completed', value: 'completed'},
  {label: 'Cancelled', value: 'cancelled'},
];

function StaffOrder({order, onChange}) {
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const questions = checkoutQuestions(order.product, order.serviceSlug);
  const act = async (status) => {
    if (status === 'cancelled' && !confirm(`Cancel order #${order.orderNo}? A wallet payment is refunded.`)) return;
    setBusy(true);
    setError('');
    try {
      await api(`/orders/staff/${order._id}`, {method: 'PATCH', body: {status, note}});
      setNote('');
      onChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  const refundPending = order.status === 'cancelled' && order.payment?.method === 'wallet' && !order.payment.refunded;
  const actions = refundPending ? ['cancelled'] : STAFF_TRANSITIONS[order.status];

  return (
    <details className="group border-b border-rule">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4 py-5 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block font-medium">
            #{order.orderNo} · {order.serviceName}
            {qty(order)}
          </span>
          <span className="text-sm text-muted">
            {order.email} · {formatDate(order.createdAt)}
          </span>
        </span>
        <span className="flex items-center gap-3">
          <Tag tone={order.status === 'paid' ? 'accent' : 'rule'}>{statusLabel(order.status)}</Tag>
          <span className="tabular-nums">{inr(order.amount / 100)}</span>
        </span>
      </summary>
      <div className="grid gap-8 pb-8 md:grid-cols-2">
        <dl className="space-y-3 text-sm">
          {questions
            .filter((q) => order.intake[q.id])
            .map((q) => (
              <div key={q.id}>
                <dt className="text-muted">{q.label}</dt>
                <dd>{order.intake[q.id]}</dd>
              </div>
            ))}
          {order.payment?.method && (
            <div>
              <dt className="text-muted">Payment</dt>
              <dd>
                {order.payment.method}
                {order.payment.razorpayPaymentId && ` · ${order.payment.razorpayPaymentId}`}
                {order.payment.refunded && ' · refunded'}
              </dd>
            </div>
          )}
        </dl>
        {actions.length > 0 && (
          <div>
            <Field
              label="Note for the customer (optional)"
              value={note}
              maxLength={300}
              onChange={(e) => setNote(e.target.value)}
              error={error}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {actions.map((s) => (
                <Button
                  key={s}
                  onClick={() => act(s)}
                  variant={s === 'cancelled' ? 'outline' : 'primary'}
                  disabled={busy}
                  icon={null}
                >
                  {refundPending ? 'Retry refund' : ACTION[s]}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </details>
  );
}

/** Pill tabs + list, shared by every staff queue. */
export function StaffQueue({path, filters, render}) {
  const [filter, setFilter] = useState(filters[0].value);
  const queue = useApi(`${path}${filter ? `?status=${filter}` : ''}`);
  return (
    <>
      <div role="tablist" aria-label="Filter" className="no-scrollbar mt-8 flex gap-2 overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f.label}
            role="tab"
            aria-selected={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm ${filter === f.value ? 'border-ink bg-ink text-paper' : 'border-rule hover:border-ink'}`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="mt-8 border-t border-rule">
        {queue.error && <p className="body py-6">⚠ {queue.error.message}</p>}
        {queue.data?.length === 0 && <p className="body py-6">Nothing here. All caught up.</p>}
        {queue.data?.map((item) => render(item, queue.reload))}
      </div>
    </>
  );
}

const SECTIONS = {
  Orders: () => (
    <StaffQueue
      path="/orders/staff/queue"
      filters={FILTERS}
      render={(o, reload) => <StaffOrder key={o._id} order={o} onChange={reload} />}
    />
  ),
  // Wrapped so the import cycle (those pages import helpers from here) resolves at render time.
  'Bharat ID': () => <IdentityQueue />,
  Tickets: () => <TicketQueue />,
};

export function Staff() {
  const {redirect, user} = useSignedIn();
  const [section, setSection] = useState('Orders');
  const isStaff = ['staff', 'superadmin'].includes(user?.role);
  usePageMeta({title: 'Work queue — Pirento'});
  if (redirect) return redirect;
  if (user && !isStaff) return <NotFound />;
  if (!user) return <div className="min-h-dvh" />;
  const Body = SECTIONS[section];

  return (
    <div className="pt-36 pb-28 md:pt-44">
      <div className="container-x">
        <p className="eyebrow">Staff</p>
        <Heading as="h1" text="Work queue." className="h-hero mt-6" />
        <nav aria-label="Queues" className="mt-12 flex gap-6 border-b border-rule">
          {Object.keys(SECTIONS).map((name) => (
            <button
              key={name}
              onClick={() => setSection(name)}
              aria-current={section === name ? 'page' : undefined}
              className={`-mb-px border-b-2 pb-3 text-lg ${section === name ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink'}`}
            >
              {name}
            </button>
          ))}
        </nav>
        <Body key={section} />
      </div>
    </div>
  );
}
