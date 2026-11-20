// The Pirento Ecosystem dashboard: what needs you, your money, your activity, and every product.
import {useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {Search, ShieldCheck} from 'lucide-react';
import {Heading} from '../../components/ui/Heading';
import {isStaffRole} from '../admin/adminNav';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';
import {openCommandPalette} from '../../components/layout/CommandPalette';
import {useSignedIn} from '../auth/useSignedIn';
import {dashboard} from '../../data/site';
import {ActivityFeed} from './ActivityFeed';
import {AppsLauncher} from './AppsLauncher';
import {ContinueList} from './ContinueList';
import {Kpis} from './Kpis';
import {NextSteps} from './NextSteps';
import {SpendByProduct} from './SpendByProduct';
import {WalletCard} from './WalletCard';
import {greeting, summaryLine} from './summary';
import {useDashboardData} from './useDashboardData';

export function Dashboard() {
  const {redirect, user} = useSignedIn();
  const data = useDashboardData();
  const [hour] = useState(() => new Date().getHours());
  const ref = useRef(null);
  usePageMotion(ref, [Boolean(user)]);
  usePageMeta({title: 'Dashboard — Pirento Ecosystem'});
  if (redirect) return redirect;
  if (!user) return <div className="min-h-dvh" />;
  const name = user.name || user.email.split('@')[0];
  const ready = data.loaded.orders && data.loaded.tickets;

  return (
    <div ref={ref} className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0">
          <p className="eyebrow">Pirento Ecosystem · Dashboard</p>
          <Heading
            as="h1"
            text={`${greeting(hour)}, / ${name}.`}
            className="mt-4 text-[clamp(2rem,3.6vw,3rem)] leading-[1.05] break-words"
          />
          <p className="body mt-3 text-base" aria-live="polite">
            {ready ? summaryLine(data) : 'Loading your account…'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={openCommandPalette}
            className="inline-flex items-center gap-3 rounded-full border border-rule px-4 py-2 text-sm text-muted hover:border-ink hover:text-ink"
          >
            <Search aria-hidden className="size-4" /> Search Pirento
            <kbd className="hidden rounded-md border border-rule px-1.5 text-xs sm:inline">Ctrl K</kbd>
          </button>
          {isStaffRole(user.role) && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm text-paper"
            >
              <ShieldCheck aria-hidden className="size-4" /> Admin
            </Link>
          )}
        </div>
      </header>

      <nav aria-label="Quick actions" className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
        {dashboard.actions.map((a) => (
          <Link key={a.to} to={a.to} className="shrink-0 rounded-full bg-stone px-4 py-2 text-sm hover:bg-rule">
            {a.label}
          </Link>
        ))}
      </nav>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <WalletCard wallet={data.wallet} />
        </div>
        <div className="lg:col-span-7">
          <Kpis data={data} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="min-w-0 space-y-4 lg:col-span-8">
          <ContinueList user={user} data={data} />
          <ActivityFeed data={data} />
        </div>
        <div className="min-w-0 space-y-4 lg:col-span-4">
          <NextSteps user={user} data={data} />
          <SpendByProduct orders={data.orders} />
        </div>
      </div>

      <AppsLauncher />
    </div>
  );
}
