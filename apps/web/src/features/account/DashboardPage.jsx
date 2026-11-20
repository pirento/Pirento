// The Pirento Ecosystem dashboard, in the design system's patterns: a greeting, then numbered sections for
// your numbers and wallet, what needs you, first steps, activity, and every product.
import {useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {ArrowDownLeft, ArrowUpRight, Search} from 'lucide-react';
import {Button} from '../../components/ui/Button';
import {StatsRow} from '../../components/ui/Blocks';
import {Heading} from '../../components/ui/Heading';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';
import {openCommandPalette} from '../../components/layout/CommandPalette';
import {useSignedIn} from '../auth/useSignedIn';
import {dashboard} from '../../data/site';
import {ActivityFeed} from './ActivityFeed';
import {AppsLauncher} from './AppsLauncher';
import {ContinueList, waitingItems} from './ContinueList';
import {DashSection} from './DashSection';
import {NextSteps, stepsDone} from './NextSteps';
import {SpendByProduct} from './SpendByProduct';
import {overviewStats} from './overviewStats';
import {greeting, summaryLine} from './summary';
import {useDashboardData} from './useDashboardData';

const MoreLink = ({to, children}) => (
  <Link to={to} className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline">
    {children}
  </Link>
);

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
  const done = stepsDone(user, data);
  // The first steps leave the page once all of them are done.
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
          <Button to="/legal/services">Browse legal services</Button>
          <Button variant="outline" icon={Search} onClick={openCommandPalette}>
            Search Pirento
          </Button>
        </div>
      </header>

      <nav aria-label="Quick actions" className="no-scrollbar -mx-1 -mt-6 flex gap-2 overflow-x-auto px-1">
        {/* The header already offers legal services, so the pills skip it. */}
        {dashboard.actions
          .filter((a) => a.to !== '/legal/services')
          .map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="shrink-0 rounded-full border border-rule px-4 py-2 text-sm transition-colors hover:border-ink"
            >
              {a.label}
            </Link>
          ))}
      </nav>

      <DashSection n={++n} id="overview" label="At a glance" title="Your account, in numbers.">
        <StatsRow compact stats={overviewStats(data)} />
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            to="/wallet#add"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-on-accent"
          >
            <ArrowDownLeft aria-hidden className="size-4" /> Add money
          </Link>
          <Link
            to="/wallet#withdraw"
            className="inline-flex items-center gap-2 rounded-full border border-rule px-5 py-2.5 text-sm hover:border-ink"
          >
            <ArrowUpRight aria-hidden className="size-4" /> Withdraw
          </Link>
          <MoreLink to="/wallet">Wallet history</MoreLink>
        </div>
      </DashSection>

      <div className={`grid gap-14 ${showSteps ? 'lg:grid-cols-12' : ''}`}>
        <div className={`min-w-0 ${showSteps ? 'lg:col-span-7' : ''}`}>
          <DashSection n={++n} id="waiting" label="Needs you" title="Pick up where / you left off.">
            <ContinueList items={waitingItems(user, data)} />
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

      <div className="grid gap-14 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-7">
          <DashSection
            n={++n}
            id="activity"
            label="Activity"
            title="What happened lately."
            action={<MoreLink to="/legal/services">New order</MoreLink>}
          >
            <ActivityFeed data={data} />
          </DashSection>
        </div>
        <div className="min-w-0 lg:col-span-5">
          <DashSection n={++n} id="spend" label="Spending" title="Where your / money went.">
            <SpendByProduct orders={data.orders} />
          </DashSection>
        </div>
      </div>

      <DashSection
        n={++n}
        id="products"
        label="Products"
        title="Every Pirento product."
        action={<MoreLink to="/products">About each</MoreLink>}
      >
        <AppsLauncher />
      </DashSection>
    </div>
  );
}
