// Users: search every account; /admin/users/<id> opens one.
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {Button} from '../../components/ui/Button';
import {useApi} from '../../lib/api/useApi';
import {formatDate} from '../../lib/format';
import {DataTable} from './DataTable';
import {ROLES, roleLabel} from './adminNav';
import {UserDetail} from './UserDetail';

export function Users({me, id}) {
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const params = new URLSearchParams({...(q && {q}), ...(role && {role})}).toString();
  const users = useApi(id ? null : `/auth/admin/users${params ? `?${params}` : ''}`);
  if (id) return <UserDetail id={id} me={me} />;

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setQ(new FormData(e.currentTarget).get('q').trim());
        }}
        className="flex max-w-2xl flex-wrap gap-2"
      >
        <label htmlFor="q" className="sr-only">
          Search by email or name
        </label>
        <input
          id="q"
          name="q"
          placeholder="Search by email or name"
          className="min-w-0 flex-1 basis-60 rounded-full border border-rule bg-paper px-5 py-2.5 outline-none focus:border-ink"
        />
        <label className="sr-only" htmlFor="role">
          Role
        </label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-full border border-rule bg-paper px-4 py-2.5 focus:border-ink"
        >
          <option value="">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline" icon={null}>
          Search
        </Button>
      </form>
      <p className="text-sm text-muted">
        {users.data ? `${users.data.total} accounts · ${users.data.staff} on the team · showing up to 100` : ''}
      </p>
      <DataTable
        error={users.error}
        rows={users.data?.users}
        empty="No account matches."
        columns={[
          {
            label: 'Account',
            cell: (u) => (
              <Link to={`/admin/users/${u._id}`} className="block hover:underline">
                <span className="block font-medium">{u.email}</span>
                <span className="text-muted">{u.name || 'No name yet'}</span>
              </Link>
            ),
          },
          {label: 'Role', cell: (u) => roleLabel(u.role)},
          {label: 'Status', cell: (u) => (u.suspended ? 'Suspended' : 'Active')},
          {label: 'Joined', right: true, cell: (u) => formatDate(u.createdAt)},
        ]}
      />
    </div>
  );
}
