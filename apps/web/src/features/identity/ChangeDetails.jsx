// The holder asks to change one step of their issued Bharat ID; the team checks it before it shows.
import {useState} from 'react';
import {CHANGEABLE_SECTIONS, ID_SECTIONS} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {Tag} from '../../components/ui/Tag';
import {appDashboards} from '../../data/site';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {formatDate} from '../../lib/format';
import {StepForm} from './StepForm';

const copy = appDashboards['bharat-id'].changes;
const CHANGEABLE = ID_SECTIONS.filter((s) => CHANGEABLE_SECTIONS.includes(s.id));
const titleOf = (id) => ID_SECTIONS.find((s) => s.id === id)?.title ?? id;

export function ChangeDetails({doc}) {
  const list = useApi('/identity/changes');
  const [pick, setPick] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const open = list.data?.find((c) => c.status === 'pending');
  const section = CHANGEABLE.find((s) => s.id === pick);

  const takeBack = async () => {
    setError('');
    try {
      await api(`/identity/changes/${open._id}`, {method: 'DELETE'});
      list.reload();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <p className="body">{copy.intro}</p>
      {open ? (
        <div role="status" className="rounded-[22px] border border-accent p-6">
          <p className="font-medium">{copy.waiting(titleOf(open.section))}</p>
          <p className="mt-2 text-sm text-muted">{copy.sent(formatDate(open.createdAt))}</p>
          <button type="button" onClick={takeBack} className="mt-4 text-sm underline underline-offset-4">
            {copy.takeBack}
          </button>
          {error && (
            <p role="alert" className="mt-2 text-sm">
              ⚠ {error}
            </p>
          )}
        </div>
      ) : section ? (
        <div className="space-y-6 rounded-[22px] border border-rule p-6">
          <p className="font-medium">{section.title}</p>
          <Field
            label={copy.note}
            required={false}
            value={note}
            maxLength={300}
            onChange={(e) => setNote(e.target.value)}
          />
          <StepForm
            section={section}
            initial={doc.sections?.[section.id]}
            submitLabel={copy.send}
            onBack={() => setPick('')}
            save={(values) => api('/identity/changes', {method: 'POST', body: {section: section.id, values, note}})}
            onSaved={() => {
              setPick('');
              setNote('');
              list.reload();
            }}
          />
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {CHANGEABLE.map((s) => (
            <Button key={s.id} variant="outline" icon={null} onClick={() => setPick(s.id)}>
              {s.title}
            </Button>
          ))}
        </div>
      )}
      <p className="text-sm text-muted">{copy.fixed}</p>
      {list.data?.some((c) => c.status !== 'pending') && (
        <ul className="divide-y divide-rule rounded-[18px] border border-rule">
          {list.data
            .filter((c) => c.status !== 'pending')
            .map((c) => (
              <li key={c._id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                <span>
                  {titleOf(c.section)} · {formatDate(c.createdAt)}
                  {c.reason && <span className="block text-muted">{c.reason}</span>}
                </span>
                <Tag>{c.status === 'approved' ? copy.approved : copy.rejected}</Tag>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
