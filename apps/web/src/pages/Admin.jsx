import {useState} from 'react';
import {Link} from 'react-router-dom';
import {statusLabel} from '@pirento/shared';
import {api, inr, useApi} from '../lib/api';
import {usePageMeta} from '../lib/page';
import {Button, Heading, Label, StatsRow} from '../components/ui';
import {NotFound} from './NotFound';
import {formatDate, useSignedIn} from './Orders';

const ROLES = ['customer', 'staff', 'superadmin'];

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

export function Admin() {
  const {redirect, user} = useSignedIn();
  const isSuper = user?.role === 'superadmin';
  const [q, setQ] = useState('');
  const users = useApi(isSuper ? `/auth/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}` : null);
  const orders = useApi(isSuper ? '/orders/staff/stats' : null);
  const kyc = useApi(isSuper ? '/identity/staff/queue' : null);
  const tickets = useApi(isSuper ? '/support/staff/queue' : null);
  usePageMeta({title: 'Admin — Pirento'});
  if (redirect) return redirect;
  if (user && !isSuper) return <NotFound />;
  if (!user) return <div className="min-h-dvh" />;

  const by = orders.data?.byStatus ?? {};
  return (
    <div className="pt-36 pb-28 md:pt-44">
      <div className="container-x">
        <p className="eyebrow">Superadmin</p>
        <Heading as="h1" text="Admin." className="h-hero mt-6" />
        <div className="mt-12">
          <StatsRow
            stats={[
              {value: String(users.data?.total ?? '—'), label: 'accounts'},
              {value: orders.data ? inr(orders.data.revenue / 100) : '—', label: 'paid order value'},
              {value: String(kyc.data?.length ?? '—'), label: 'Bharat IDs to review'},
              {value: String(tickets.data?.length ?? '—'), label: 'tickets waiting on us'},
            ]}
          />
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {Object.entries(by).map(([status, n]) => (
            <span key={status} className="rounded-full border border-rule px-3 py-1 text-sm">
              {statusLabel(status)} · <span className="tabular-nums">{n}</span>
            </span>
          ))}
          <Link to="/staff" className="rounded-full border border-ink px-3 py-1 text-sm">
            Open work queue →
          </Link>
        </div>

        <section className="mt-20" aria-labelledby="people">
          <Label n={1}>
            <span id="people">People and roles</span>
          </Label>
          <p className="body mt-4">
            Staff work the queue. Superadmins also see this page. A changed role applies within 15 minutes.
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
          <ul className="mt-6 max-w-3xl">
            {users.data?.users.map((u) => (
              <UserRow key={u._id} u={u} me={user._id} onChange={users.reload} />
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
