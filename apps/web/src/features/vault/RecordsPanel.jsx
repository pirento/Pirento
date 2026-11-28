// Vault records: every kind a person keeps (VAULT_KINDS), grouped. The list shows titles; a record opens, changes or
// goes away only after the Bharat ID unlock, and each one says whether it goes to the nominee. `only` narrows the
// panel to some kinds (Linked accounts reuses it for investments and insurance).
import {useState} from 'react';
import {Eye, EyeOff, Pencil, Plus, Trash2} from 'lucide-react';
import {VAULT_KINDS, vaultKind} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {TextArea} from '../../components/ui/TextArea';
import {vaultCopy} from '../../data/site';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {ReleaseSwitch} from './ReleaseSwitch';
import {shown, useUnlock} from './unlock';

const copy = vaultCopy.records;
const GROUPS = [...new Set(VAULT_KINDS.map((k) => k.group))];

/** The form for one record: its kind's fields, a title, and whether it goes to the nominee. */
function RecordForm({start, kinds, onSaved, onCancel}) {
  const guard = useUnlock();
  const choices = kinds ? VAULT_KINDS.filter((k) => kinds.includes(k.id)) : VAULT_KINDS;
  const [kind, setKind] = useState(start?.kind ?? choices[0].id);
  const [title, setTitle] = useState(start?.title ?? '');
  const [fields, setFields] = useState(start?.fields ?? {});
  const [release, setRelease] = useState(start?.release ?? false);
  const [error, setError] = useState('');
  const def = vaultKind(kind);
  const save = async (e) => {
    e.preventDefault();
    setError('');
    const body = {kind, title, fields: Object.fromEntries(Object.entries(fields).filter(([, v]) => v)), release};
    try {
      await guard((headers) =>
        start
          ? api(`/vault/records/${start._id}`, {method: 'PUT', body, headers})
          : api('/vault/records', {method: 'POST', body, headers}),
      );
      onSaved();
    } catch (err) {
      setError(shown(err));
    }
  };
  return (
    <form onSubmit={save} noValidate className="grid gap-4 rounded-[18px] border border-rule p-5 sm:grid-cols-2">
      {!start && choices.length > 1 && (
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium">{copy.kind}</span>
          <select
            value={kind}
            onChange={(e) => {
              setKind(e.target.value);
              setFields({});
            }}
            className="mt-2 block w-full rounded-[14px] border border-rule bg-paper px-4 py-3"
          >
            {GROUPS.filter((g) => choices.some((k) => k.group === g)).map((g) => (
              <optgroup key={g} label={g}>
                {choices
                  .filter((k) => k.group === g)
                  .map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.label}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </label>
      )}
      <div className="sm:col-span-2">
        <Field label={copy.name} required value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      {def.fields.map((f) => {
        const props = {
          label: f.label,
          value: fields[f.id] ?? '',
          onChange: (e) => setFields((x) => ({...x, [f.id]: e.target.value})),
        };
        if (f.type === 'long')
          return (
            <div key={f.id} className="sm:col-span-2">
              <TextArea {...props} rows={3} required={false} />
            </div>
          );
        return (
          <Field
            key={f.id}
            {...props}
            type={f.type === 'date' ? 'date' : f.type === 'secret' ? 'password' : 'text'}
            inputMode={f.type === 'number' ? 'decimal' : undefined}
            autoComplete="off"
          />
        );
      })}
      <label className="flex items-center gap-3 text-sm sm:col-span-2">
        <input type="checkbox" checked={release} onChange={(e) => setRelease(e.target.checked)} className="size-4" />
        {copy.release}
      </label>
      {error && (
        <p role="alert" className="text-sm sm:col-span-2">
          ⚠ {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3 sm:col-span-2">
        <Button type="submit" variant="accent">
          {copy.save}
        </Button>
        <Button type="button" variant="outline" icon={null} onClick={onCancel}>
          {copy.close}
        </Button>
      </div>
    </form>
  );
}

export function Records({only}) {
  const list = useApi('/vault/records');
  const guard = useUnlock();
  const [group, setGroup] = useState(null);
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState({}); // id → opened record
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const mine = (list.data ?? []).filter((r) => !only || only.includes(r.kind));
  const groups = GROUPS.filter((g) => mine.some((r) => vaultKind(r.kind)?.group === g));
  const shownList = mine.filter((r) => !group || vaultKind(r.kind)?.group === group);

  const toggle = async (r) => {
    if (open[r._id]) return setOpen((o) => ({...o, [r._id]: undefined}));
    setError('');
    try {
      const full = await guard((headers) => api(`/vault/records/${r._id}`, {headers}));
      setOpen((o) => ({...o, [r._id]: full}));
    } catch (err) {
      setError(shown(err));
    }
  };
  const remove = async (r) => {
    if (!confirm(`Delete ${r.title}? This cannot be undone.`)) return;
    setError('');
    try {
      await guard((headers) => api(`/vault/records/${r._id}`, {method: 'DELETE', headers}));
      list.reload();
    } catch (err) {
      setError(shown(err));
    }
  };
  const done = () => {
    setAdding(false);
    setEditing(null);
    setOpen({});
    list.reload();
  };

  return (
    <div className="rounded-[22px] border border-rule p-6 md:p-8" data-reveal>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Show records">
          {[null, ...groups].map((g) => (
            <button
              key={g ?? 'all'}
              type="button"
              aria-pressed={group === g}
              onClick={() => setGroup(g)}
              className={`rounded-full border px-4 py-2 text-sm ${group === g ? 'border-ink bg-ink text-paper' : 'border-rule hover:border-ink'}`}
            >
              {g ?? copy.all}
            </button>
          ))}
        </div>
        {!adding && (
          <Button variant="accent" icon={Plus} onClick={() => setAdding(true)}>
            {copy.add}
          </Button>
        )}
      </div>
      {adding && (
        <div className="mt-6">
          <RecordForm kinds={only} onSaved={done} onCancel={() => setAdding(false)} />
        </div>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm">
          ⚠ {error}
        </p>
      )}
      {list.data && shownList.length === 0 && !adding && <p className="body mt-6">{copy.empty}</p>}
      <ul className="mt-4">
        {shownList.map((r) => {
          const def = vaultKind(r.kind);
          const full = open[r._id];
          return (
            <li key={r._id} className="border-b border-rule py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-muted">{def?.label ?? r.kind}</p>
                  <p className="font-medium break-words">{r.title}</p>
                </div>
                <span className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => toggle(r)}
                    className="rounded-full p-2 hover:bg-stone"
                    aria-label={`${full ? copy.close : copy.open} ${r.title}`}
                    aria-expanded={Boolean(full)}
                  >
                    {full ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
                  </button>
                  <button
                    onClick={async () => {
                      setError('');
                      try {
                        setEditing(await guard((headers) => api(`/vault/records/${r._id}`, {headers})));
                      } catch (err) {
                        setError(shown(err));
                      }
                    }}
                    className="rounded-full p-2 hover:bg-stone"
                    aria-label={`${copy.edit} ${r.title}`}
                  >
                    <Pencil aria-hidden className="size-4" />
                  </button>
                  <button
                    onClick={() => remove(r)}
                    className="rounded-full p-2 hover:bg-stone"
                    aria-label={`${copy.remove} ${r.title}`}
                  >
                    <Trash2 aria-hidden className="size-4" />
                  </button>
                </span>
              </div>
              {full && (
                <dl className="mt-4 grid gap-x-6 gap-y-3 rounded-[14px] bg-stone p-4 text-sm sm:grid-cols-2">
                  {def.fields
                    .filter((f) => full.fields[f.id])
                    .map((f) => (
                      <div key={f.id} className="min-w-0">
                        <dt className="text-xs text-muted">{f.label}</dt>
                        <dd className="break-words whitespace-pre-wrap">{full.fields[f.id]}</dd>
                      </div>
                    ))}
                </dl>
              )}
              {editing?._id === r._id && (
                <div className="mt-4">
                  <RecordForm start={editing} onSaved={done} onCancel={() => setEditing(null)} />
                </div>
              )}
              <div className="mt-3">
                <ReleaseSwitch type="records" item={r} onChange={list.reload} />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
