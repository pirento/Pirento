// Superadmin: search people and change their role.
import {useState} from 'react';
import {Button} from '../../components/ui/Button';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {formatDate} from '../../lib/format';

export const ROLES = ['customer', 'staff', 'superadmin'];

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

export function People({me}) {
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
