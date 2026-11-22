// The form for a new internship or job, used by staff (admin → Openings) and by companies (Intern → Company).
import {useState} from 'react';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {TextArea} from '../../components/ui/TextArea';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {selectCls} from './Pipeline';

const EMPTY = {
  title: '',
  track: '',
  kind: 'internship',
  mode: 'remote',
  location: '',
  weeks: '',
  stipend: '',
  description: '',
};

export function OpeningForm({path, onDone, label = 'Post opening', note}) {
  const tracks = useApi('/learning/tracks');
  const [f, setF] = useState(EMPTY);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF((x) => ({...x, [k]: e.target.value}));
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api(path, {method: 'POST', body: {...f, weeks: f.weeks ? Number(f.weeks) : undefined}});
      setF(EMPTY);
      onDone();
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <form onSubmit={submit} className="space-y-4 rounded-[22px] border border-rule p-6">
      <p className="eyebrow">New opening</p>
      {note && <p className="text-sm text-muted">{note}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" required value={f.title} onChange={set('title')} />
        <label className="grid gap-1 text-sm">
          Track
          <select value={f.track} onChange={set('track')} className={selectCls}>
            <option value="">Any</option>
            {tracks.data?.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Kind
          <select value={f.kind} onChange={set('kind')} className={selectCls}>
            <option value="internship">Internship</option>
            <option value="job">Job</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Where
          <select value={f.mode} onChange={set('mode')} className={selectCls}>
            <option value="remote">Remote</option>
            <option value="onsite">On site</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </label>
        <Field label="City (optional)" value={f.location} onChange={set('location')} />
        <Field label="Weeks (optional)" type="number" min={1} max={52} value={f.weeks} onChange={set('weeks')} />
        <Field label="Stipend (optional, as written)" value={f.stipend} onChange={set('stipend')} />
      </div>
      <TextArea label="What the work is" value={f.description} onChange={set('description')} />
      {error && (
        <p role="alert" className="text-sm">
          ⚠ {error}
        </p>
      )}
      <Button type="submit" variant="accent">
        {label}
      </Button>
    </form>
  );
}
