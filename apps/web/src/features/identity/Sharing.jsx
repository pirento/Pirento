// Bharat ID dashboard: businesses that asked to see some of your details. Allow or decline; revoke later.
import {useState} from 'react';
import {CONSENT_FIELDS} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {Tag} from '../../components/ui/Tag';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {formatDate} from '../../lib/format';

export function Sharing() {
  const list = useApi('/identity/consents');
  const [error, setError] = useState('');
  const decide = async (id, decision) => {
    setError('');
    try {
      await api(`/identity/consents/${id}`, {method: 'POST', body: {decision}});
      list.reload();
    } catch (err) {
      setError(err.message);
    }
  };
  if (list.loading) return null;
  if (list.error) return <p className="body">⚠ {list.error.message}</p>;
  if (!list.data?.length) {
    return (
      <p className="body text-muted">
        No business has asked to see your details. When one does, we email you and it shows here.
      </p>
    );
  }
  return (
    <div className="max-w-3xl space-y-4">
      {error && (
        <p role="alert" className="text-sm">
          ⚠ {error}
        </p>
      )}
      <ul className="space-y-3">
        {list.data.map((c) => (
          <li
            key={c._id}
            className={`rounded-[18px] border p-5 ${c.status === 'pending' ? 'border-accent' : 'border-rule'}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-medium">{c.businessName}</p>
              <Tag tone={c.status === 'pending' ? 'accent' : 'rule'}>{c.status}</Tag>
            </div>
            <p className="mt-2 text-sm">Wants to see: {c.fields.map((f) => CONSENT_FIELDS[f]).join(', ')}</p>
            <p className="mt-1 text-sm text-muted">
              For: {c.purpose} · asked {formatDate(c.createdAt)}
            </p>
            {c.status === 'pending' && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={() => decide(c._id, 'approve')} variant="accent" icon={null}>
                  Allow
                </Button>
                <Button onClick={() => decide(c._id, 'decline')} variant="outline" icon={null}>
                  Decline
                </Button>
              </div>
            )}
            {c.status === 'approved' && (
              <button
                type="button"
                onClick={() => decide(c._id, 'revoke')}
                className="mt-3 text-sm underline underline-offset-4"
              >
                Stop sharing
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
