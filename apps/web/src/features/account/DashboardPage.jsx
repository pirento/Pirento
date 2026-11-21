// The Pirento dashboard: the hub of the account. It says what needs you across products, takes you into each
// product's own dashboard, and holds what belongs to the account itself (the one wallet, identity, support).
// The work of each product stays in that product's dashboard; the hub does not repeat it.
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
import {YourProducts} from './YourProducts';
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
  // How many things wait in each product, for the badge on its card.
  const needs = {};
  for (const it of waiting) if (it.product) needs[it.product] = (needs[it.product] ?? 0) + 1;
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

      <DashSection n={++n} id="products" label="Your products" title="Pick up / where you work.">
        <YourProducts needs={needs} />
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

      <DashSection n={++n} id="account" label="Your account" title="Shared by / every product.">
        <StatsRow compact stats={accountStats(data)} />
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
          <Link to="/account" className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline">
            Profile and security
          </Link>
        </div>
      </DashSection>
    </div>
  );
}
