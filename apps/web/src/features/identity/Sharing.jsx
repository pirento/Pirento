// Bharat ID dashboard: businesses that asked to see some of your details. Allow or decline; revoke later.
import {useState} from 'react';
import {CONSENT_FIELDS} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {Tag} from '../../components/ui/Tag';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {formatDate} from '../../lib/format';

function Requests() {
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

const ACTIONS = {
  verify: 'Checked that your Bharat ID is issued',
  'consent.request': 'Asked to see some details',
  'consent.read': 'Read the details you allowed',
  'auth.request': 'Asked you to prove it is you',
  'auth.read': 'Read the result of that check',
};

/** Every live check of this Bharat ID by a business, newest first. */
function History() {
  const log = useApi('/identity/consents/log');
  if (log.loading || log.error || !log.data?.length) return null;
  return (
    <section className="max-w-3xl">
      <h2 className="text-2xl">Who checked your Bharat ID</h2>
      <ul className="mt-4 divide-y divide-rule rounded-[18px] border border-rule">
        {log.data.map((r) => (
          <li key={r._id} className="grid gap-1 p-4 text-sm sm:grid-cols-[1fr_auto]">
            <span>
              <span className="font-medium">{r.businessName}</span> · {ACTIONS[r.action] ?? r.action}
              {r.fields?.length > 0 && (
                <span className="text-muted"> ({r.fields.map((f) => CONSENT_FIELDS[f]).join(', ')})</span>
              )}
            </span>
            <span className="text-muted">{formatDate(r.createdAt)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Sharing() {
  return (
    <div className="space-y-14">
      <Requests />
      <History />
    </div>
  );
}
