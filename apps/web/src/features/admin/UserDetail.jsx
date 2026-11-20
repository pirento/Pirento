// One account for staff: profile, orders, wallet and Bharat ID, plus role and suspension for superadmins.
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {PRODUCTS, statusLabel} from '@pirento/shared';
import {ArrowLeft} from 'lucide-react';
import {Button} from '../../components/ui/Button';
import {Label} from '../../components/ui/Heading';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {formatDate, inr} from '../../lib/format';
import {DataTable} from './DataTable';
import {ACCESS_OF, ROLES, roleLabel} from './adminNav';
import {WalletAdjust} from './WalletAdjust';

/** A panel that only loads when this role may read it. */
const useIf = (allowed, path) => useApi(allowed ? path : null);

export function UserDetail({id, me}) {
  const may = (section) => ACCESS_OF(section).includes(me.role);
  const user = useApi(`/auth/admin/users/${id}`);
  const orders = useIf(may('orders'), `/orders/staff/user/${id}`);
  const wallet = useIf(may('users'), `/wallet/staff/user/${id}`);
  const identity = useIf(may('bharat-id'), `/identity/staff/user/${id}`);
  const [error, setError] = useState('');
  const u = user.data;
  const isSuper = me.role === 'superadmin';

  const change = async (path, body, question) => {
    if (!confirm(question)) return;
    setError('');
    try {
      await api(`/auth/admin/users/${id}/${path}`, {method: 'PATCH', body});
      user.reload();
    } catch (err) {
      setError(err.message);
    }
  };

  if (user.error) return <p className="body">⚠ {user.error.message}</p>;
  if (!u) return <p className="body text-muted">Loading…</p>;

  return (
    <div className="space-y-12">
      <Link to="/admin/users" className="inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
        <ArrowLeft aria-hidden className="size-4" /> All users
      </Link>

      <section className="rounded-[22px] border border-rule p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="eyebrow">
              {u.staffId && `${u.staffId} · `}
              {roleLabel(u.role)}
              {u.suspended ? ' · Suspended' : ''}
            </p>
            <h2 className="mt-3 text-2xl break-all">{u.email}</h2>
            <p className="mt-1 text-muted">
              {u.name || 'No name yet'} · joined {formatDate(u.createdAt)}
            </p>
          </div>
          {isSuper && u._id !== me._id && (
            <div className="flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor="user-role">
                Role
              </label>
              <select
                id="user-role"
                value={u.role}
                onChange={(e) =>
                  change(
                    'role',
                    {role: e.target.value},
                    `Make ${u.email} ${roleLabel(e.target.value)}? They sign in again.`,
                  )
                }
                className="rounded-full border border-rule bg-paper px-4 py-2 focus:border-ink"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {roleLabel(r)}
                  </option>
                ))}
              </select>
              {u.staffId && (
                <Button
                  variant="outline"
                  icon={null}
                  onClick={() => {
                    const password = prompt(`New password for ${u.staffId} (10+ characters). Share it privately.`);
                    if (password)
                      change('password', {password}, `Set a new password for ${u.staffId}? They are signed out.`);
                  }}
                >
                  Reset password
                </Button>
              )}
              <Button
                variant="outline"
                icon={null}
                onClick={() =>
                  change(
                    'suspend',
                    {suspended: !u.suspended},
                    u.suspended
                      ? `Let ${u.email} sign in again?`
                      : `Suspend ${u.email}? They are signed out everywhere.`,
                  )
                }
              >
                {u.suspended ? 'Restore account' : 'Suspend account'}
              </Button>
            </div>
          )}
        </div>
        {isSuper && u.role === 'staff' && (
          <fieldset className="mt-6 border-t border-rule pt-6">
            <legend className="eyebrow">Products this person works on (none ticked = all)</legend>
            <div className="mt-4 flex flex-wrap gap-2">
              {PRODUCTS.map((p) => {
                const on = u.products?.includes(p.slug);
                const next = on ? u.products.filter((s) => s !== p.slug) : [...(u.products ?? []), p.slug];
                return (
                  <button
                    key={p.slug}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      change(
                        'products',
                        {products: next},
                        `Limit ${u.email} to: ${next.join(', ') || 'all products'}? They sign in again.`,
                      )
                    }
                    className={`rounded-full border px-3 py-1.5 text-sm ${on ? 'border-ink bg-ink text-paper' : 'border-rule hover:border-ink'}`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}
        {error && (
          <p role="alert" className="mt-4 text-sm">
            ⚠ {error}
          </p>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {may('users') && (
          <div className="rounded-[22px] border border-rule p-6">
            <p className="eyebrow">Wallet</p>
            <p className="num mt-4 text-3xl!">{wallet.data ? inr(wallet.data.balance / 100) : '—'}</p>
            <p className="mt-2 text-sm text-muted">{wallet.data?.transactions.length ?? 0} recent movements</p>
            {may('payments') && <WalletAdjust userId={id} onDone={wallet.reload} />}
          </div>
        )}
        {may('bharat-id') && (
          <div className="rounded-[22px] border border-rule p-6">
            <p className="eyebrow">Bharat ID</p>
            <p className="mt-4 text-xl">
              {identity.data ? (identity.data.bharatId ?? statusLabel(identity.data.status)) : 'Not started'}
            </p>
            {identity.data?.reason && <p className="mt-2 text-sm text-muted">Rejected: {identity.data.reason}</p>}
          </div>
        )}
      </div>

      {may('orders') && (
        <section>
          <Label n={1}>Orders</Label>
          <div className="mt-6">
            <DataTable
              error={orders.error}
              rows={orders.data}
              empty="No orders yet."
              columns={[
                {
                  label: 'Order',
                  cell: (o) => (
                    <Link to={`/orders/${o._id}`} className="hover:underline">
                      #{o.orderNo}
                    </Link>
                  ),
                },
                {label: 'Service', cell: (o) => o.serviceName},
                {label: 'Status', cell: (o) => statusLabel(o.status)},
                {label: 'Amount', right: true, cell: (o) => inr(o.amount / 100)},
                {label: 'Placed', right: true, cell: (o) => formatDate(o.createdAt)},
              ]}
            />
          </div>
        </section>
      )}

      {may('users') && (
        <section>
          <Label n={2}>Wallet history</Label>
          <div className="mt-6">
            <DataTable
              error={wallet.error}
              rows={wallet.data?.transactions}
              empty="No wallet movements."
              columns={[
                {label: 'When', cell: (t) => formatDate(t.createdAt)},
                {label: 'Note', cell: (t) => t.note},
                {label: 'Amount', right: true, cell: (t) => `${t.type === 'debit' ? '−' : '+'}${inr(t.amount / 100)}`},
                {label: 'Balance', right: true, cell: (t) => inr(t.balanceAfter / 100)},
              ]}
            />
          </div>
        </section>
      )}
    </div>
  );
}
