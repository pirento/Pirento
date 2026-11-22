// Admin: what one business may do (check methods and the details it may ask for), and its access log.
import {useState} from 'react';
import {AUTH_METHODS, CONSENT_FIELDS} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {Tag} from '../../components/ui/Tag';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {formatDate} from '../../lib/format';

function Pick({label, options, chosen, onToggle}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium">{label}</legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map(([id, text, off]) => (
          <label
            key={id}
            className={`rounded-full border px-3 py-1.5 text-sm has-focus-visible:outline-2 ${off ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${chosen.includes(id) ? 'border-ink bg-ink text-paper' : 'border-rule hover:border-ink'}`}
          >
            <input
              type="checkbox"
              className="sr-only"
              disabled={off}
              checked={chosen.includes(id)}
              onChange={() => onToggle(id)}
            />
            {text}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function BusinessAccess({b, onChange}) {
  const [methods, setMethods] = useState(b.methods ?? []);
  const [fields, setFields] = useState(b.fields ?? []);
  const [note, setNote] = useState('');
  const toggle = (set) => (id) => set((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]));
  const save = async () => {
    setNote('');
    try {
      await api(`/identity/staff/business/${b._id}/access`, {method: 'PATCH', body: {methods, fields}});
      setNote('Saved.');
      onChange();
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };
  return (
    <section className="space-y-5 rounded-[18px] border border-rule p-5">
      <p className="font-medium">What they may do</p>
      <Pick
        label="Ways to check a holder (level 1 is the weakest)"
        options={AUTH_METHODS.map((m) => [
          m.id,
          `${m.label} · L${m.level}${m.expected ? ' · Expected' : ''}`,
          m.expected,
        ])}
        chosen={methods}
        onToggle={toggle(setMethods)}
      />
      <Pick
        label="Details they may ask for (only what their work needs)"
        options={Object.entries(CONSENT_FIELDS).map(([id, text]) => [id, text])}
        chosen={fields}
        onToggle={toggle(setFields)}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} variant="outline" icon={null}>
          Save what they may do
        </Button>
        {note && (
          <p role="status" className="text-sm">
            {note}
          </p>
        )}
      </div>
    </section>
  );
}

export function AccessLogView({b}) {
  const [open, setOpen] = useState(false);
  const log = useApi(open ? `/identity/staff/business/${b._id}/log` : null);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm underline underline-offset-4">
        Show their access log
      </button>
    );
  }
  if (log.error) return <p className="text-sm">⚠ {log.error.message}</p>;
  // The first render after opening comes before the request starts, so data can still be empty.
  if (log.loading || !log.data) return null;
  return (
    <section className="rounded-[18px] border border-rule p-5">
      <p className="font-medium">Access log</p>
      {!log.data.length && <p className="mt-2 text-sm text-muted">Nothing yet.</p>}
      <ul className="mt-3 max-h-80 divide-y divide-rule overflow-y-auto text-sm">
        {log.data.map((r) => (
          <li key={r._id} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <span>
              <Tag tone={r.mode === 'live' ? 'accent' : 'rule'}>{r.mode}</Tag> {r.action}
              {r.method && ` · ${r.method}`}
              {r.fields?.length > 0 && ` · ${r.fields.join(', ')}`} · <span className="tabular-nums">{r.bharatId}</span>
            </span>
            <span className="text-muted">
              {formatDate(r.createdAt)} · {r.ip}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
