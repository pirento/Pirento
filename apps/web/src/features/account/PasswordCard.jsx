// Staff only: change the password you use at the staff sign-in.
import {useState} from 'react';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {Label} from '../../components/ui/Heading';
import {api} from '../../lib/api/client';

export function PasswordCard({n, staffId}) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [note, setNote] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    try {
      await api('/auth/me/password', {method: 'PATCH', body: {current, next}});
      setCurrent('');
      setNext('');
      setNote('Password changed.');
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };
  return (
    <form onSubmit={submit} className="rounded-[22px] border border-rule p-8" data-reveal>
      <Label n={n}>Staff password</Label>
      <p className="mt-4 text-sm text-muted">
        For the staff sign-in as <span className="text-ink">{staffId}</span>.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field
          label="Current password"
          type="password"
          autoComplete="current-password"
          required
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
        <Field
          label="New password (10+)"
          type="password"
          autoComplete="new-password"
          required
          minLength={10}
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
      </div>
      <Button type="submit" variant="outline" icon={null} className="mt-6">
        Change password
      </Button>
      {note && (
        <p role="status" className="mt-3 text-sm">
          {note}
        </p>
      )}
    </form>
  );
}
