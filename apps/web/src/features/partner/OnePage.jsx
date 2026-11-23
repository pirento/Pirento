// Pirento One dashboard: join, the partner link and what it brought, every referred order, and the plans.
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {Check, Copy} from 'lucide-react';
import {statusLabel} from '@pirento/shared';
import {StatsRow} from '../../components/ui/Blocks';
import {Button} from '../../components/ui/Button';
import {DashSection} from '../../components/ui/DashSection';
import {Tag} from '../../components/ui/Tag';
import {appDashboards} from '../../data/site';
import {useSignedIn} from '../auth/useSignedIn';
import {AppFrame} from '../products/AppFrame';
import {PlanCards} from './PlanCards';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {formatDate, inr} from '../../lib/format';
import {usePageMeta} from '../../lib/page';
import {AiTool} from '../ai/AiTool';

const copy = appDashboards.one;
const PAID = ['paid', 'in_progress', 'completed'];
const FILTERS = [
  {id: 'all', label: 'All', test: () => true},
  {id: 'paid', label: 'Paid', test: (o) => PAID.includes(o.status)},
  {id: 'unpaid', label: 'Not paid yet', test: (o) => o.status === 'pending_payment'},
];

function ReferralList({orders}) {
  const [filter, setFilter] = useState('all');
  const shown = orders.filter(FILTERS.find((f) => f.id === filter).test);
  return (
    <>
      <div role="tablist" aria-label="Filter" className="no-scrollbar flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm ${filter === f.id ? 'border-ink bg-ink text-paper' : 'border-rule hover:border-ink'}`}
          >
            {f.label}
          </button>
        ))}
      </div>
      {shown.length === 0 && <p className="mt-6 text-muted">{copy.referrals.empty}</p>}
      <ul className="mt-6 border-t border-rule">
        {shown.map((o) => (
          <li key={o._id} className="flex flex-wrap items-center justify-between gap-4 border-b border-rule py-4">
            <span className="min-w-0">
              <span className="block font-medium">{o.serviceName}</span>
              <span className="text-xs text-muted">
                #{o.orderNo} · {formatDate(o.createdAt)}
                {o.commission?.amount > 0 &&
                  ` · ${inr(o.commission.amount / 100)} commission${o.commission.paid ? '' : ' (on its way)'}`}
              </span>
            </span>
            <span className="flex items-center gap-3">
              <Tag tone={PAID.includes(o.status) ? 'accent' : 'rule'}>{statusLabel(o.status)}</Tag>
              <span className="tabular-nums">{inr(o.amount / 100)}</span>
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

export function One({product, section}) {
  const {redirect, user} = useSignedIn();
  const me = useApi(user ? '/orders/partner/me' : null);
  const plans = useApi('/orders/partner-plans');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  usePageMeta({
    title: 'Pirento One — partners',
    description: 'Share your partner code and track the orders it brings.',
  });
  if (redirect) return redirect;

  const join = async () => {
    setError('');
    try {
      await api('/orders/partner/join', {method: 'POST'});
      me.reload();
    } catch (err) {
      setError(err.message);
    }
  };
  const buy = async (plan) => {
    setError('');
    setNote('');
    if (!window.confirm(copy.plans.confirm(plan.name, inr(plan.price / 100)))) return;
    try {
      await api('/orders/partner/plan', {method: 'POST', body: {planId: plan._id}});
      setNote(copy.plans.bought);
      me.reload();
    } catch (err) {
      setError(err.message);
    }
  };
  const d = me.data;
  const frame = {product, section, ready: !me.loading};
  const freePlan = plans.data?.find((p) => !p.price);

  if (section === 'plans') {
    const until = d?.plan && !d.plan.free && new Date(d.plan.until).toLocaleDateString('en-IN', {dateStyle: 'medium'});
    return (
      <AppFrame {...frame} ready={frame.ready && !plans.loading} title={copy.plans.title} intro={copy.plans.intro}>
        {until && <p className="body">{copy.plans.until(until)}</p>}
        {(error || note) && (
          <p role={error ? 'alert' : 'status'} className="text-sm">
            {error ? `⚠ ${error}` : note}{' '}
            {/balance/i.test(error) && (
              <Link to={`/${product.slug}/dashboard/wallet`} className="underline">
                {copy.plans.topUp}
              </Link>
            )}
          </p>
        )}
        {plans.error && <p className="body">⚠ {plans.error.message}</p>}
        {plans.data?.length === 0 && <p className="body text-muted">{copy.plans.empty}</p>}
        {plans.data?.length > 0 && (
          <PlanCards
            plans={plans.data}
            current={d?.plan}
            action={(p, mine) =>
              !p.price ? (
                !d && (
                  <Button onClick={join} variant="outline" className="w-full justify-center">
                    {copy.plans.join}
                  </Button>
                )
              ) : (
                <Button
                  onClick={() => buy(p)}
                  variant={p.recommended ? 'accent' : 'outline'}
                  className="w-full justify-center"
                >
                  {(mine ? copy.plans.renew : copy.plans.buy)(inr(p.price / 100))}
                </Button>
              )
            }
          />
        )}
        <p className="text-sm text-muted">{copy.plans.paid}</p>
      </AppFrame>
    );
  }

  if (!me.loading && !d) {
    return (
      <AppFrame {...frame} title={copy.hello} intro={copy.intro}>
        <div className="max-w-2xl rounded-[22px] border border-rule p-8" data-reveal>
          <p className="body">Joining is free. You get a code and a link to share.</p>
          {error && (
            <p role="alert" className="mt-4 text-sm">
              ⚠ {error}
            </p>
          )}
          <Button onClick={join} variant="accent" className="mt-6">
            Become a partner
          </Button>
          <p className="mt-4 text-sm text-muted">
            {copy.commission(freePlan)}{' '}
            <Link to={`/${product.slug}/dashboard/plans`} className="underline">
              {copy.plans.label}
            </Link>
          </p>
        </div>
      </AppFrame>
    );
  }
  if (!d) return <AppFrame {...frame} title={copy.hello} />;

  if (section === 'referrals') {
    return (
      <AppFrame {...frame} title={copy.referrals.title}>
        <ReferralList orders={d.orders} />
      </AppFrame>
    );
  }

  const link = `${window.location.origin}/?ref=${d.code}`;
  const settled = d.orders.filter((o) => PAID.includes(o.status));
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard blocked: the link is on screen to copy by hand.
    }
  };
  return (
    <AppFrame {...frame} title={copy.hello} intro={copy.intro}>
      <DashSection n={1} id="link" label={copy.link.label} title={copy.link.title}>
        <div className="flex flex-wrap items-end justify-between gap-6 rounded-[22px] border border-accent p-6 md:p-8">
          <div className="min-w-0">
            <p className="display text-3xl">{d.code}</p>
            <p className="mt-2 break-all text-sm text-muted">{link}</p>
          </div>
          <Button variant="outline" icon={copied ? Check : Copy} onClick={copyLink}>
            {copied ? 'Copied' : 'Copy link'}
          </Button>
        </div>
      </DashSection>
      <DashSection n={2} id="glance" label={copy.glance.label} title={copy.glance.title}>
        <StatsRow
          compact
          stats={[
            {value: String(d.orders.length), label: 'Orders with your code'},
            {value: String(settled.length), label: 'Paid'},
            {value: inr(settled.reduce((n, o) => n + o.amount, 0) / 100), label: 'Paid order value'},
            {
              value: inr(d.orders.reduce((n, o) => n + (o.commission?.paid ? o.commission.amount : 0), 0) / 100),
              label: 'Commission earned',
            },
          ]}
        />
        <p className="mt-6 text-sm text-muted">
          {copy.commission(d.plan)}{' '}
          <Link to={`/${product.slug}/dashboard/plans`} className="underline">
            {copy.plans.label}
          </Link>
        </p>
      </DashSection>
      <DashSection n={3} id="ai" label="Pirento AI" title="Words to share, / and what to try next.">
        <div className="grid gap-6 xl:grid-cols-2">
          <AiTool id="shareMessage" fixed={{code: d.code}} />
          <AiTool id="partnerCoach" />
        </div>
      </DashSection>
    </AppFrame>
  );
}
