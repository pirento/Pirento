// Pirento Capital dashboard: EMI calculator and the waitlist.
import {useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {emi} from '@pirento/shared';
import {PageHero} from '../../components/PageHero';
import {StatsRow} from '../../components/ui/Blocks';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {Label, Section} from '../../components/ui/Heading';
import {api} from '../../lib/api/client';
import {useSession} from '../../lib/api/session';
import {inr} from '../../lib/format';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';

export function Capital() {
  const {user} = useSession();
  const [form, setForm] = useState({amount: 500000, rate: 12, months: 36});
  const [need, setNeed] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const ref = useRef(null);
  usePageMotion(ref);
  usePageMeta({
    title: 'Pirento Capital — EMI calculator',
    description: 'Work out a loan EMI. Lending is not open yet.',
  });

  const set = (k) => (e) => setForm((f) => ({...f, [k]: Math.max(0, Number(e.target.value) || 0)}));
  const monthly = emi(form.amount, form.rate, form.months);
  const total = monthly * form.months;

  const join = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api('/support', {method: 'POST', body: {subject: 'Capital waitlist', message: need}});
      setSent(true);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div ref={ref}>
      <PageHero
        label="Pirento Capital · Dashboard"
        title="Plan the loan / before you take it."
        hl="before you take it."
        intro="Pirento does not lend money yet. Use the calculator to plan, and join the waitlist to hear when lending opens."
      />
      <Section className="pt-0! md:pt-0!">
        <div className="grid gap-10 lg:grid-cols-12">
          <form className="space-y-6 lg:col-span-5" onSubmit={(e) => e.preventDefault()} data-reveal>
            <Label n={1}>EMI calculator</Label>
            <Field
              label="Loan amount (₹)"
              type="number"
              min="0"
              step="1000"
              value={form.amount}
              onChange={set('amount')}
            />
            <Field
              label="Interest rate (% a year)"
              type="number"
              min="0"
              max="60"
              step="0.1"
              value={form.rate}
              onChange={set('rate')}
            />
            <Field label="Term (months)" type="number" min="1" max="360" value={form.months} onChange={set('months')} />
          </form>
          <div className="lg:col-span-7" data-reveal>
            <StatsRow
              stats={[
                {value: inr(Math.round(monthly)), label: 'monthly EMI'},
                {value: inr(Math.round(total - form.amount)), label: 'total interest'},
                {value: inr(Math.round(total)), label: 'total you repay'},
              ]}
            />
            <p className="mt-4 text-sm text-muted">An estimate on a reducing balance. It is not a loan offer.</p>
          </div>
        </div>
      </Section>
      <Section className="pt-0! md:pt-0!">
        <div className="max-w-2xl" data-reveal>
          <Label n={2}>Waitlist</Label>
          {sent ? (
            <p className="body mt-6">
              <strong>You are on the list.</strong> We will reply on your support request when lending opens.
            </p>
          ) : user ? (
            <form onSubmit={join} noValidate className="mt-6 space-y-4">
              <Field
                label="What would you use a loan for?"
                required
                maxLength={500}
                value={need}
                onChange={(e) => setNeed(e.target.value)}
                error={error}
              />
              <Button type="submit" variant="accent">
                Join the waitlist
              </Button>
            </form>
          ) : (
            <p className="body mt-6">
              <Link to="/login?next=/capital/dashboard" className="text-ink underline underline-offset-4">
                Sign in
              </Link>{' '}
              to join the waitlist.
            </p>
          )}
        </div>
      </Section>
    </div>
  );
}
