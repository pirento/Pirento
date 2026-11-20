// The team's side of a ticket: who is on it and notes the customer never sees.
import {useState} from 'react';
import {Button} from '../../components/ui/Button';
import {TextArea} from '../../components/ui/TextArea';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {formatDate} from '../../lib/format';

export function TeamPanel({ticket, me, onChange}) {
  const isSuper = me?.role === 'superadmin';
  const team = useApi(isSuper ? '/auth/admin/team' : null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const mine = ticket.assignee?.id === me?._id;

  const call = async (path, method, body, done) => {
    setError('');
    try {
      await api(`/support/${ticket._id}/${path}`, {method, body});
      done?.();
      onChange();
    } catch (err) {
      setError(err.message);
    }
  };
  const assign = (assignee) => call('assign', 'PATCH', {assignee});

  return (
    <aside aria-label="Team only" className="mt-10 max-w-3xl rounded-[22px] border border-dashed border-rule p-6">
      <p className="eyebrow">Team only · the customer does not see this</p>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">On it:</span>
        <span>{ticket.assignee?.email ?? 'nobody yet'}</span>
        {isSuper ? (
          <>
            <label className="sr-only" htmlFor="tk-assign">
              Assign to
            </label>
            <select
              id="tk-assign"
              value={ticket.assignee?.id ?? ''}
              onChange={(e) => {
                const m = team.data?.find((x) => x._id === e.target.value);
                assign(m ? {id: m._id, email: m.email} : null);
              }}
              className="rounded-full border border-rule bg-paper px-3 py-1.5"
            >
              <option value="">Nobody</option>
              {team.data?.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.email}
                </option>
              ))}
            </select>
          </>
        ) : (
          <Button variant="outline" icon={null} onClick={() => assign(mine ? null : {id: me._id, email: me.email})}>
            {mine ? 'Hand back' : 'Take it'}
          </Button>
        )}
      </div>
      <ol className="mt-6 space-y-3">
        {(ticket.notes ?? []).map((n, i) => (
          <li key={i} className="rounded-[14px] bg-stone p-4 text-sm">
            <p className="text-xs text-muted">
              {n.by} · {formatDate(n.at)}
            </p>
            <p className="mt-1 whitespace-pre-wrap">{n.body}</p>
          </li>
        ))}
      </ol>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          call('notes', 'POST', {body: note}, () => setNote(''));
        }}
        className="mt-4 space-y-3"
      >
        <TextArea label="Team note" value={note} onChange={(e) => setNote(e.target.value)} />
        {error && (
          <p role="alert" className="text-sm">
            ⚠ {error}
          </p>
        )}
        <Button type="submit" variant="outline" icon={null} disabled={note.trim().length < 2}>
          Add note
        </Button>
      </form>
    </aside>
  );
}
