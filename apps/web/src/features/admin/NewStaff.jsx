// Superadmin: issue a staff sign-in (staff ID + first password) to a new or existing account.
import {useState} from 'react';
import {Button} from '../../components/ui/Button';
import {api} from '../../lib/api/client';
import {ROLES, roleLabel} from './adminNav';

const EMPTY = {staffId: '', email: '', name: '', role: 'staff', password: ''};
const input = 'w-full min-w-0 rounded-full border border-rule bg-paper px-4 py-2.5 text-sm outline-none focus:border-ink';

export function NewStaff({onDone}) {
  const [f, setF] = useState(EMPTY);
  const [error, setError] = useState('');
  const [made, setMade] = useState('');
  const set = (k) => (e) => setF((x) => ({...x, [k]: e.target.value}));
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMade('');
    try {
      const user = await api('/auth/admin/staff', {method: 'POST', body: f});
      setMade(
        `${user.staffId} can now sign in at /admin/login. Share the password privately; they can change it in Account.`,
      );
      setF(EMPTY);
      onDone();
    } catch (err) {
      setError(err.message);
    }
  };
  const field = (label, el) => (
    <label className="grid gap-1 text-xs text-muted">
      {label}
      {el}
    </label>
  );
  return (
    <form onSubmit={submit} className="rounded-[22px] border border-rule p-6">
      <p className="eyebrow">Add a staff sign-in</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {field(
          'Staff ID',
          <input
            required
            value={f.staffId}
            onChange={set('staffId')}
            placeholder="priya.ops"
            autoCapitalize="none"
            className={input}
          />,
        )}
        {field('Work email', <input required type="email" value={f.email} onChange={set('email')} className={input} />)}
        {field('Name', <input value={f.name} onChange={set('name')} className={input} />)}
        {field(
          'Role',
          <select value={f.role} onChange={set('role')} className={input}>
            {ROLES.filter((r) => r !== 'customer').map((r) => (
              <option key={r} value={r}>
                {roleLabel(r)}
              </option>
            ))}
          </select>,
        )}
        {field(
          'First password (10+)',
          <input
            required
            minLength={10}
            type="text"
            autoComplete="off"
            value={f.password}
            onChange={set('password')}
            className={input}
          />,
        )}
      </div>
      <Button type="submit" variant="accent" icon={null} className="mt-4">
        Create staff sign-in
      </Button>
      {error && (
        <p role="alert" className="mt-3 text-sm">
          ⚠ {error}
        </p>
      )}
      {made && (
        <p role="status" className="mt-3 text-sm">
          {made}
        </p>
      )}
    </form>
  );
}
