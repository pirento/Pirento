// Checkout: quantity, intake questions and the server-set price.
import {useRef, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {ShieldCheck} from 'lucide-react';
import {checkoutQuestions} from '@pirento/shared';
import {PageHero} from '../../components/PageHero';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {Section} from '../../components/ui/Heading';
import {useSignedIn} from '../auth/useSignedIn';
import {NotFound} from '../ecosystem/NotFoundPage';
import {Question} from './Question';
import {savedRef} from './helpers';
import {api} from '../../lib/api/client';
import {inr} from '../../lib/format';
import {usePageMotion} from '../../lib/motion';
import {useApi} from '../../lib/api/useApi';
import {usePageMeta} from '../../lib/page';
import {useService} from '../../lib/prices';

export function Checkout() {
  const {slug} = useParams();
  const service = useService(slug);
  const navigate = useNavigate();
  const {redirect} = useSignedIn();
  const [answers, setAnswers] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [coupon, setCoupon] = useState({code: '', applied: null, error: ''});
  const settings = useApi('/catalog/settings');
  const ref = useRef(null);
  usePageMotion(ref, [slug]);
  usePageMeta({title: `Checkout · ${service?.name ?? ''} — Pirento`});
  if (!service?.price) return <NotFound />;
  if (redirect) return redirect;

  const questions = checkoutQuestions(service.product, service.slug);
  const paused = settings.data?.paused.includes(service.product);
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const order = await api('/orders', {
        method: 'POST',
        body: {serviceSlug: slug, quantity, intake: answers, ref: savedRef(), coupon: applied?.code},
      });
      navigate(`/orders/${order._id}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  // Asks the server what the code takes off; the order itself is priced again on the server.
  const applyCoupon = async () => {
    const code = coupon.code.trim().toUpperCase();
    if (!code) return;
    try {
      const quote = await api(`/orders/coupons/${encodeURIComponent(code)}?service=${slug}&quantity=${quantity}`);
      setCoupon({code, applied: {...quote, quantity}, error: ''});
    } catch (err) {
      setCoupon({code, applied: null, error: err.message});
    }
  };
  // A changed quantity changes the discount; ask again.
  const applied = coupon.applied?.quantity === quantity || !coupon.applied ? coupon.applied : null;

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
            <div className="mt-6 flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <Field
                  label="Discount code (optional)"
                  value={coupon.code}
                  maxLength={16}
                  onChange={(e) => setCoupon({code: e.target.value, applied: null, error: ''})}
                  error={coupon.error}
                />
              </div>
              <Button type="button" variant="outline" icon={null} className="mb-px" onClick={applyCoupon}>
                Apply
              </Button>
            </div>
            {applied && (
              <div className="mt-4 flex items-baseline justify-between text-sm">
                <span className="text-muted">{applied.code} · you pay</span>
                <span className="tabular-nums">
                  −{inr(applied.discount / 100)} · <span className="font-medium">{inr(applied.total / 100)}</span>
                </span>
              </div>
            )}
            {error && (
              <p role="alert" className="mt-6 text-sm">
                ⚠ {error}
              </p>
            )}
            {paused && (
              <p role="status" className="mt-6 text-sm">
                Orders for this product are paused for now. Please try again later.
              </p>
            )}
            <Button type="submit" variant="accent" className="mt-8 w-full justify-center" disabled={busy || paused}>
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
