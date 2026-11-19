import {useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {BadgeCheck, Inbox, LayoutDashboard, ShoppingBag, Users} from 'lucide-react';
import {PRODUCTS, statusLabel} from '@pirento/shared';
import {api, inr, useApi} from '../lib/api';
import {usePageMeta} from '../lib/page';
import {Button, Label, StatsRow} from '../components/ui';
import {NotFound} from './NotFound';
import {STAFF_SECTIONS, formatDate, useSignedIn} from './Orders';

const ROLES = ['customer', 'staff', 'superadmin'];

function Overview({isSuper}) {
  const users = useApi(isSuper ? '/auth/admin/users' : null);
  const orders = useApi('/orders/staff/stats');
  const kyc = useApi('/identity/staff/queue');
  const tickets = useApi('/support/staff/queue');
  const d = orders.data;
  const top = Math.max(1, ...Object.values(d?.byProduct ?? {}).map((p) => p.amount));

  return (
    <div className="space-y-12">
      <StatsRow
        stats={[
          ...(isSuper ? [{value: String(users.data?.total ?? '—'), label: 'accounts'}] : []),
          {value: d ? inr(d.revenue / 100) : '—', label: 'paid order value'},
          {value: String(kyc.data?.length ?? '—'), label: 'Bharat IDs to review'},
          {value: String(tickets.data?.length ?? '—'), label: 'tickets waiting on us'},
        ]}
      />
      <div>
        <Label n={1}>Orders by status</Label>
        <div className="mt-6 flex flex-wrap gap-2">
          {Object.entries(d?.byStatus ?? {}).map(([status, n]) => (
            <Link
              key={status}
              to="/admin?tab=Orders"
              className="rounded-full border border-rule px-4 py-2 text-sm hover:border-ink"
            >
              {statusLabel(status)} · <span className="tabular-nums">{n}</span>
            </Link>
          ))}
        </div>
      </div>
      <div>
        <Label n={2}>Paid orders by product</Label>
        <ul className="mt-6 space-y-3">
          {PRODUCTS.map((p) => {
            const row = d?.byProduct?.[p.slug];
            return (
              <li
                key={p.slug}
                className="grid grid-cols-[8rem_1fr_auto] items-center gap-4 text-sm sm:grid-cols-[11rem_1fr_9rem]"
              >
                <Link to={`/${p.slug}`} className="truncate hover:underline">
                  {p.name}
                </Link>
                <span className="h-2 overflow-hidden rounded-full bg-stone" aria-hidden>
                  {/* Each bar in its own product's colour. */}
                  <span
                    className="block h-full rounded-full"
                    style={{width: `${((row?.amount ?? 0) / top) * 100}%`, background: p.color}}
                  />
                </span>
                <span className="text-right tabular-nums">{row ? `${inr(row.amount / 100)} · ${row.count}` : '—'}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function UserRow({u, me, onChange}) {
  const [error, setError] = useState('');
  const change = async (role) => {
    if (!confirm(`Make ${u.email} ${role}? Their sessions end and they sign in again.`)) return;
    setError('');
    try {
      await api(`/auth/admin/users/${u._id}/role`, {method: 'PATCH', body: {role}});
      onChange();
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <li className="flex flex-wrap items-center justify-between gap-4 border-b border-rule py-4">
      <span className="min-w-0">
        <span className="block truncate font-medium">{u.email}</span>
        <span className="text-xs text-muted">Joined {formatDate(u.createdAt)}</span>
        {error && (
          <span role="alert" className="block text-sm">
            ⚠ {error}
          </span>
        )}
      </span>
      <label className="flex items-center gap-2 text-sm">
        <span className="sr-only">Role for {u.email}</span>
        <select
          value={u.role}
          disabled={u._id === me}
          onChange={(e) => change(e.target.value)}
          className="rounded-full border border-rule bg-paper px-4 py-2 focus:border-ink"
        >
          {ROLES.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </label>
    </li>
  );
}

function People({me}) {
  const [q, setQ] = useState('');
  const users = useApi(`/auth/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`);
  return (
    <div>
      <p className="body">
        Staff work the queues. Superadmins also see Overview and People. A changed role applies within 15 minutes.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setQ(new FormData(e.currentTarget).get('q').trim());
        }}
        className="mt-6 flex max-w-xl gap-2"
      >
        <label htmlFor="q" className="sr-only">
          Search by email
        </label>
        <input
          id="q"
          name="q"
          placeholder="Search by email"
          className="min-w-0 flex-1 rounded-full border border-rule bg-paper px-5 py-2.5 outline-none focus:border-ink"
        />
        <Button type="submit" variant="outline" icon={null}>
          Search
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted">
        {users.data ? `${users.data.total} accounts · ${users.data.staff} staff or superadmin` : ''}
      </p>
      <ul className="mt-2 max-w-3xl">
        {users.data?.users.map((u) => (
          <UserRow key={u._id} u={u} me={me} onChange={users.reload} />
        ))}
      </ul>
    </div>
  );
}

const TABS = [
  {id: 'Overview', icon: LayoutDashboard, superOnly: false},
  {id: 'Orders', icon: ShoppingBag},
  {id: 'Bharat ID', icon: BadgeCheck},
  {id: 'Tickets', icon: Inbox},
  {id: 'People', icon: Users, superOnly: true},
];

export function Admin() {
  const {redirect, user} = useSignedIn();
  const [params, setParams] = useSearchParams();
  const isSuper = user?.role === 'superadmin';
  const isStaff = isSuper || user?.role === 'staff';
  usePageMeta({title: 'Admin — Pirento Ecosystem'});
  if (redirect) return redirect;
  if (user && !isStaff) return <NotFound />;
  if (!user) return <div className="min-h-dvh" />;

  const tabs = TABS.filter((t) => !t.superOnly || isSuper);
  // An unknown or not-allowed tab falls back to the first one, so links can deep-link safely.
  const tab = tabs.find((t) => t.id === params.get('tab')) ?? tabs[0];
  const Queue = STAFF_SECTIONS[tab.id];
  const body =
    tab.id === 'Overview' ? <Overview isSuper={isSuper} /> : tab.id === 'People' ? <People me={user._id} /> : <Queue />;

  return (
    <div className="pt-28 pb-28 md:pt-32">
      <div className="container-x grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <p className="eyebrow">{isSuper ? 'Superadmin' : 'Staff'}</p>
          <h1 className="mt-3 text-4xl">Admin</h1>
          <nav
            aria-label="Admin sections"
            className="no-scrollbar mt-8 flex gap-2 overflow-x-auto lg:flex-col lg:gap-1"
          >
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setParams({tab: t.id})}
                aria-current={t.id === tab.id ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-3 rounded-full px-4 py-2.5 text-left text-sm transition-colors ${
                  t.id === tab.id ? 'bg-ink text-paper' : 'text-muted hover:bg-stone hover:text-ink'
                }`}
              >
                <t.icon aria-hidden className="size-4" />
                {t.id}
              </button>
            ))}
          </nav>
        </aside>
        <section aria-labelledby="admin-tab" className="min-w-0">
          <h2 id="admin-tab" className="display text-3xl">
            {tab.id}
          </h2>
          <div className="mt-8">
            <div key={tab.id}>{body}</div>
          </div>
        </section>
      </div>
    </div>
  );
}
