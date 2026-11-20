// Account deletions: approve (the person is forgotten across every service) or decline with a reason.
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {Button} from '../../components/ui/Button';
import {api} from '../../lib/api/client';
import {formatDate} from '../../lib/format';
import {StaffQueue} from './StaffQueue';

function Row({d, onChange}) {
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const decide = async (decision) => {
    if (decision === 'approve' && !confirm(`Delete ${d.email} for good? This cannot be undone.`)) return;
    setError('');
    try {
      await api(`/auth/admin/deletions/${d._id}`, {method: 'PATCH', body: {decision, answer}});
      onChange();
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <div className="grid gap-4 border-b border-rule py-5 md:grid-cols-[1fr_auto] md:items-center">
      <div className="min-w-0">
        <p className="font-medium break-all">
          {d.status === 'requested' ? (
            <Link to={`/admin/users/${d.userId}`} className="hover:underline">
              {d.email}
            </Link>
          ) : (
            d.email
          )}
        </p>
        <p className="text-sm text-muted">
          Asked {formatDate(d.createdAt)}
          {d.reason && ` · “${d.reason}”`}
          {d.answer && ` · ${d.answer}`}
          {d.decidedBy && ` · by ${d.decidedBy}`}
        </p>
        {error && (
          <p role="alert" className="mt-2 text-sm">
            ⚠ {error}
          </p>
        )}
      </div>
      {d.status === 'requested' && (
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor={`del-${d._id}`}>
            Reason to decline
          </label>
          <input
            id={`del-${d._id}`}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Reason, if declining"
            className="w-48 rounded-full border border-rule bg-paper px-4 py-2 text-sm outline-none focus:border-ink"
          />
          <Button variant="accent" icon={null} onClick={() => decide('approve')}>
            Delete account
          </Button>
          <Button variant="outline" icon={null} onClick={() => decide('reject')}>
            Decline
          </Button>
        </div>
      )}
    </div>
  );
}

export const Deletions = () => (
  <StaffQueue
    path="/auth/admin/deletions"
    filters={[
      {label: 'Waiting', value: 'requested'},
      {label: 'Deleted', value: 'approved'},
      {label: 'Declined', value: 'rejected'},
    ]}
    render={(d, reload) => <Row key={d._id} d={d} onChange={reload} />}
  />
);
