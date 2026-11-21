// The Pirento dashboard: the account's own place. Money, records, support and settings for every product live
// here; each product's work stays in that product's own dashboard, so this page does not list the products.
import {useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowDownLeft, ArrowUpRight, LifeBuoy, Search} from 'lucide-react';
import {Button} from '../../components/ui/Button';
import {StatsRow} from '../../components/ui/Blocks';
import {DashSection} from '../../components/ui/DashSection';
import {Heading} from '../../components/ui/Heading';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';
import {openCommandPalette} from '../../components/layout/CommandPalette';
import {useSignedIn} from '../auth/useSignedIn';
import {dashboard} from '../../data/site';
import {ContinueList, waitingItems} from './ContinueList';
import {NextSteps, stepsDone} from './NextSteps';
import {paymentHistory, spentThisMonth} from './payments';
import {hasReceipt} from '../orders/receipts';
import {getProduct} from '@pirento/shared';
import {formatDate, inr} from '../../lib/format';
import {accountStats} from './accountStats';
import {greeting, summaryLine} from './summary';
import {useDashboardData} from './useDashboardData';

const pill = 'inline-flex items-center gap-2 rounded-full border border-rule px-5 py-2.5 text-sm hover:border-ink';

export function Dashboard() {
  const {redirect, user} = useSignedIn();
  const data = useDashboardData();
  const [hour] = useState(() => new Date().getHours());
  const ref = useRef(null);
  usePageMotion(ref, [Boolean(user)]);
  usePageMeta({title: 'Dashboard — Pirento Ecosystem'});
  if (redirect) return redirect;
  if (!user) return <div className="min-h-dvh" />;
  // First name only; without a name we just say hello rather than print an email address.
  const name = user.name?.trim().split(/\s+/)[0];
  const ready = data.loaded.orders && data.loaded.tickets;
  const waiting = waitingItems(user, data);
  const history = data.wallet && data.orders ? paymentHistory(data.wallet.transactions, data.orders) : null;
  const glance = [
    ...accountStats(data).slice(0, 1),
    {label: 'Spent this month', value: history ? inr(spentThisMonth(history) / 100) : '—'},
    {label: 'Receipts', value: data.orders ? String(data.orders.filter(hasReceipt).length) : '—'},
    ...accountStats(data).slice(1, 3),
  ];
  const done = stepsDone(user, data);
  const showSteps = done && Object.values(done).some((d) => !d);
  let n = 0;

  return (
    <div ref={ref} className="space-y-14 md:space-y-16">
      <header className="flex flex-wrap items-end justify-between gap-8">
        <div className="min-w-0">
          <p className="eyebrow">Pirento Ecosystem · Dashboard</p>
          <Heading
            as="h1"
            text={name ? `${greeting(hour)}, / ${name}.` : `${greeting(hour)}.`}
            className="mt-5 text-[clamp(2.25rem,4.4vw,3.75rem)] leading-[1.02] break-words"
          />
          <p className="body mt-4" aria-live="polite">
            {ready ? summaryLine(data) : 'Loading your account…'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" icon={Search} onClick={openCommandPalette}>
            Search Pirento
          </Button>
        </div>
      </header>

      <DashSection n={++n} id="glance" label="At a glance" title="Your account, / every product.">
        <StatsRow compact stats={glance} />
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            to="/wallet#add"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-on-accent"
          >
            <ArrowDownLeft aria-hidden className="size-4" /> Add money
          </Link>
          <Link to="/wallet#withdraw" className={pill}>
            <ArrowUpRight aria-hidden className="size-4" /> Withdraw
          </Link>
          <Link to="/support" className={pill}>
            <LifeBuoy aria-hidden className="size-4" /> Support
          </Link>
        </div>
      </DashSection>

      <div className={`grid gap-14 ${showSteps ? 'lg:grid-cols-12' : ''}`}>
        <div className={`min-w-0 ${showSteps ? 'lg:col-span-7' : ''}`}>
          <DashSection n={++n} id="waiting" label="Needs you" title="Across / every product.">
            <ContinueList items={waiting} />
          </DashSection>
        </div>
        {showSteps && (
          <div className="min-w-0 lg:col-span-5">
            <DashSection
              n={++n}
              id="start"
              label="Get started"
              title="Four first steps."
              action={
                <span className="text-sm text-muted tabular-nums">
                  {Object.values(done).filter(Boolean).length} of {dashboard.steps.length} done
                </span>
              }
            >
              <NextSteps done={done} />
            </DashSection>
          </div>
        )}
      </div>

      <DashSection
        n={++n}
        id="recent"
        label="Payments"
        title="Latest / payments."
        action={
          <Link to="/payments" className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline">
            Full history
          </Link>
        }
      >
        {history?.length === 0 && <p className="text-muted">No payments yet.</p>}
        <ul className="border-t border-rule">
          {history?.slice(0, 6).map((p) => (
            <li key={p.key} className="flex items-center justify-between gap-4 border-b border-rule py-3.5" data-reveal>
              <span className="min-w-0">
                <span className="block truncate">{p.title}</span>
                <span className="text-xs text-muted">
                  {p.product && `${getProduct(p.product)?.name} · `}
                  {p.method} · {formatDate(p.at)}
                </span>
              </span>
              <span className="shrink-0 text-sm tabular-nums">
                {p.direction === 'in' ? '+' : '−'}
                {inr(p.amount / 100)}
              </span>
            </li>
          ))}
        </ul>
      </DashSection>
    </div>
  );
}
