// Set or change the password used with your user ID (and at the staff door, if you have a staff ID).
import {useState} from 'react';
import {passwordProblem} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {Label} from '../../components/ui/Heading';
import {api} from '../../lib/api/client';
import {PasswordField} from '../auth/PasswordField';

export function PasswordCard({n, me, onDone}) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [note, setNote] = useState('');
  const has = me.hasPassword;
  const problem = next && passwordProblem(next);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api('/auth/me/password', {method: 'PATCH', body: {current, next}});
      setCurrent('');
      setNext('');
      setNote(has ? 'Password changed.' : 'Password set. You can now sign in with your user ID and password.');
      onDone();
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };
  return (
    <form onSubmit={submit} className="rounded-[22px] border border-rule p-8" data-reveal>
      <Label n={n}>Password</Label>
      <p className="mt-4 text-sm text-muted">
        {has
          ? 'Change the password you sign in with.'
          : 'You sign in with codes today. Set a password to also sign in with your user ID.'}
        {me.staffId && (
          <>
            {' '}
            It is also your staff password for <span className="text-ink">{me.staffId}</span>.
          </>
        )}
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {has && (
          <PasswordField
            label="Current password"
            autoComplete="current-password"
            required
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        )}
        <PasswordField
          label="New password"
          autoComplete="new-password"
          required
          value={next}
          onChange={(e) => setNext(e.target.value)}
          error={problem || undefined}
        />
      </div>
      <Button type="submit" variant="outline" icon={null} className="mt-6" disabled={!next || Boolean(problem)}>
        {has ? 'Change password' : 'Set password'}
      </Button>
      {note && (
        <p role="status" className="mt-3 text-sm">
          {note}
        </p>
      )}
    </form>
  );
}
