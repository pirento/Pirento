// Book a service for a customer: find them, pick the service, answer its questions. The order lands unpaid in
// their dashboard; they pay it there. The server prices it and checks the answers like a normal checkout.
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {PRODUCTS, checkoutQuestions, servicesFor} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {Label} from '../../components/ui/Heading';
import {TextArea} from '../../components/ui/TextArea';
import {Question} from '../orders/Question';
import {api} from '../../lib/api/client';
import {useSession} from '../../lib/api/session';
import {useApi} from '../../lib/api/useApi';
import {inr} from '../../lib/format';
import {useServicesFor} from '../../lib/prices';

const field = 'mt-2 block w-full rounded-[14px] border border-rule bg-paper px-4 py-3 outline-none focus:border-ink';

export function BookService() {
  const {user} = useSession();
  const [q, setQ] = useState('');
  const [customer, setCustomer] = useState(null);
  const found = useApi(
    !customer && q.trim().length >= 3 ? `/auth/admin/customers?q=${encodeURIComponent(q.trim())}` : null,
  );
  // Products with something on sale, inside the staffer's own products when they are kept to some.
  const scope = user?.role === 'staff' && user.products?.length ? user.products : null;
  const products = PRODUCTS.filter(
    (p) => (!scope || scope.includes(p.slug)) && servicesFor(p.slug).some((s) => s.price),
  );
  const [product, setProduct] = useState(products[0]?.slug ?? '');
  const services = useServicesFor(product).filter((s) => s.price);
  const [slug, setSlug] = useState('');
  const service = services.find((s) => s.slug === slug);
  const [answers, setAnswers] = useState({});
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [booked, setBooked] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      setBooked(
        await api('/orders/staff/book', {
          method: 'POST',
          body: {userId: customer._id, serviceSlug: slug, intake: answers, note},
        }),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  const again = () => {
    setBooked(null);
    setCustomer(null);
    setQ('');
    setSlug('');
    setAnswers({});
    setNote('');
  };

  if (booked) {
    return (
      <div className="mt-8 max-w-xl" role="status">
        <p className="text-lg">
          Order #{booked.orderNo} booked for {booked.email}: {booked.serviceName}, {inr(booked.amount / 100)}.
        </p>
        <p className="body mt-2">It waits in their dashboard for payment. Nothing has been charged.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to={`/orders/${booked._id}`}
            className="rounded-full border border-rule px-5 py-2.5 text-sm hover:border-ink"
          >
            Open the order
          </Link>
          <Button variant="outline" onClick={again}>
            Book another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="mt-8 max-w-2xl space-y-12">
      <div>
        <Label n={1}>Customer</Label>
        {customer ? (
          <p className="mt-6 flex flex-wrap items-center gap-3">
            <span>
              {customer.name ? `${customer.name} · ` : ''}
              {customer.email}
            </span>
            <button type="button" onClick={() => setCustomer(null)} className="text-sm text-muted underline">
              Change
            </button>
          </p>
        ) : (
          <>
            <label className="mt-6 block">
              <span className="text-sm font-medium">Email or name</span>
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="At least 3 letters"
                className={field}
              />
            </label>
            {found.data?.length === 0 && (
              <p className="body mt-3">No active customer matches. They need a Pirento account first.</p>
            )}
            <ul className="mt-3">
              {found.data?.map((c) => (
                <li key={c._id}>
                  <button
                    type="button"
                    onClick={() => setCustomer(c)}
                    className="w-full border-b border-rule py-3 text-left hover:border-ink"
                  >
                    {c.name ? `${c.name} · ` : ''}
                    {c.email}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div>
        <Label n={2}>Service</Label>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">Product</span>
            <select
              value={product}
              onChange={(e) => {
                setProduct(e.target.value);
                setSlug('');
                setAnswers({});
              }}
              className={field}
            >
              {products.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium">Service</span>
            <select
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setAnswers({});
              }}
              className={field}
            >
              <option value="">Choose one</option>
              {services.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.name} · {inr(s.price)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {service && (
        <div>
          <Label n={3}>Their answers</Label>
          <div className="mt-6 space-y-8">
            {checkoutQuestions(service.product, service.slug).map((question) => (
              <Question
                key={question.id}
                q={question}
                value={answers[question.id]}
                onChange={(v) => setAnswers({...answers, [question.id]: v})}
              />
            ))}
            <TextArea
              label="A note for the customer (optional)"
              required={false}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
            />
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm">
          ⚠ {error}
        </p>
      )}
      <Button type="submit" variant="accent" disabled={busy || !customer || !service}>
        {busy ? 'Booking' : service ? `Book for ${inr(service.price)}` : 'Book'}
      </Button>
    </form>
  );
}
