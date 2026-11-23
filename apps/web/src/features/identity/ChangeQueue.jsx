// Staff review of changes holders ask for on an issued Bharat ID: the current and the asked values side by side.
import {useState} from 'react';
import {ID_SECTIONS, formatBharatId} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {Tag} from '../../components/ui/Tag';
import {StaffQueue} from '../admin/StaffQueue';
import {api} from '../../lib/api/client';
import {formatDate} from '../../lib/format';

function Values({title, section, values}) {
  return (
    <div className="rounded-[18px] border border-rule p-5">
      <p className="eyebrow">{title}</p>
      <dl className="mt-3 space-y-2 text-sm">
        {section.fields.map((f) => (
          <div key={f.id}>
            <dt className="text-muted">{f.label}</dt>
            <dd>{values?.[f.id] || '—'}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Change({c, onChange}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const section = ID_SECTIONS.find((s) => s.id === c.section);
  const decide = async (decision) => {
    setError('');
    try {
      await api(`/identity/staff/changes/${c._id}`, {method: 'PATCH', body: {decision, reason}});
      onChange();
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <details className="border-b border-rule">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4 py-5 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block font-medium">
            {c.fullName ?? c.email} · {section?.title}
          </span>
          <span className="text-sm text-muted">
            {formatBharatId(c.bharatId)} · {formatDate(c.createdAt)}
          </span>
        </span>
        <Tag tone={c.status === 'pending' ? 'accent' : 'rule'}>{c.status}</Tag>
      </summary>
      <div className="space-y-6 pb-8">
        {c.note && <p className="text-sm">Their reason: {c.note}</p>}
        <div className="grid gap-4 md:grid-cols-2">
          <Values title="Now" section={section} values={c.current} />
          <Values title="Asked for" section={section} values={c.data} />
        </div>
        {c.reason && <p className="text-sm">Reason given: {c.reason}</p>}
        {c.status === 'pending' && (
          <div className="max-w-xl">
            <Field
              label="Reason (needed to turn down)"
              value={reason}
              maxLength={300}
              onChange={(e) => setReason(e.target.value)}
              error={error}
            />
            <div className="mt-4 flex gap-2">
              <Button onClick={() => decide('approve')} icon={null}>
                Approve the change
              </Button>
              <Button onClick={() => decide('reject')} variant="outline" icon={null}>
                Turn down
              </Button>
            </div>
          </div>
        )}
      </div>
    </details>
  );
}

export const ChangeQueue = () => (
  <StaffQueue
    path="/identity/staff/changes"
    filters={[
      {label: 'To review', value: 'pending'},
      {label: 'Approved', value: 'approved'},
      {label: 'Turned down', value: 'rejected'},
    ]}
    render={(c, reload) => <Change key={c._id} c={c} onChange={reload} />}
  />
);
