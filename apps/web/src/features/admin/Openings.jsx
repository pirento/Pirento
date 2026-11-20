// Openings: post internships and jobs for the Intern site, close them, review applications.
import {useState} from 'react';
import {getProduct} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {TextArea} from '../../components/ui/TextArea';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {formatDate} from '../../lib/format';
import {DataTable} from './DataTable';

const EMPTY = {title: '', track: '', kind: 'internship', mode: 'remote', location: '', description: ''};
const select = 'rounded-full border border-rule bg-paper px-4 py-2.5 text-sm focus:border-ink';
const STATUSES = {new: 'New', shortlisted: 'Shortlisted', declined: 'Declined'};

function NewOpening({onDone}) {
  const [f, setF] = useState(EMPTY);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF((x) => ({...x, [k]: e.target.value}));
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api('/learning/staff/openings', {method: 'POST', body: f});
      setF(EMPTY);
      onDone();
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <form onSubmit={submit} className="space-y-4 rounded-[22px] border border-rule p-6">
      <p className="eyebrow">New opening</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" required value={f.title} onChange={set('title')} />
        <label className="grid gap-1 text-sm">
          Track
          <select value={f.track} onChange={set('track')} className={select}>
            <option value="">Any</option>
            {getProduct('intern').tracks.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Kind
          <select value={f.kind} onChange={set('kind')} className={select}>
            <option value="internship">Internship</option>
            <option value="job">Job</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Where
          <select value={f.mode} onChange={set('mode')} className={select}>
            <option value="remote">Remote</option>
            <option value="onsite">On site</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </label>
        <Field label="City (optional)" value={f.location} onChange={set('location')} />
      </div>
      <TextArea label="What the work is" value={f.description} onChange={set('description')} />
      {error && (
        <p role="alert" className="text-sm">
          ⚠ {error}
        </p>
      )}
      <Button type="submit" variant="accent">
        Post opening
      </Button>
    </form>
  );
}

function Applications({opening}) {
  const apps = useApi(`/learning/staff/openings/${opening._id}/applications`);
  const setStatus = async (a, status) => {
    await api(`/learning/staff/openings/applications/${a._id}`, {method: 'PATCH', body: {status}});
    apps.reload();
  };
  return (
    <div className="mt-4">
      <DataTable
        error={apps.error}
        rows={apps.data}
        empty="No applications yet."
        columns={[
          {label: 'Applied', cell: (a) => formatDate(a.createdAt)},
          {label: 'Email', cell: (a) => a.email},
          {label: 'Note', cell: (a) => <span className="whitespace-pre-line">{a.note || '—'}</span>},
          {
            label: 'Status',
            cell: (a) => (
              <select
                value={a.status}
                onChange={(e) => setStatus(a, e.target.value)}
                aria-label={`Status for ${a.email}`}
                className={select}
              >
                {Object.entries(STATUSES).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            ),
          },
        ]}
      />
    </div>
  );
}

export function Openings() {
  const list = useApi('/learning/staff/openings');
  const [openId, setOpenId] = useState(null);
  const toggle = async (o) => {
    await api(`/learning/staff/openings/${o._id}`, {method: 'PATCH', body: {open: !o.open}});
    list.reload();
  };
  return (
    <div className="space-y-8">
      <NewOpening onDone={list.reload} />
      {list.error && <p className="body">⚠ {list.error.message}</p>}
      {list.data?.length === 0 && <p className="body">No openings yet.</p>}
      <ul className="space-y-4">
        {list.data?.map((o) => (
          <li key={o._id} className="rounded-[22px] border border-rule p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="eyebrow">
                  {o.kind} · {o.mode} {o.track && `· ${o.track}`} · {o.open ? 'open' : 'closed'}
                </p>
                <h3 className="mt-2 text-xl">{o.title}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" icon={null} onClick={() => setOpenId(openId === o._id ? null : o._id)}>
                  {o.applications} applications
                </Button>
                <Button variant="outline" icon={null} onClick={() => toggle(o)}>
                  {o.open ? 'Close it' : 'Reopen'}
                </Button>
              </div>
            </div>
            {openId === o._id && <Applications opening={o} />}
          </li>
        ))}
      </ul>
    </div>
  );
}
