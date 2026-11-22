// Admin → Intern programme: prices of the 3/6/9/12-month places (superadmin), who is enrolled and their mark,
// live classes with their recordings, and practice tasks the AI could not grade.
import {useState} from 'react';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {Tag} from '../../components/ui/Tag';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {useSession} from '../../lib/api/session';
import {formatDate, formatDay, inr} from '../../lib/format';
import {selectCls} from '../learning/Pipeline';
import {VideoUpload} from '../learning/Video';

function Price({p, canEdit, onSaved}) {
  const [rupees, setRupees] = useState(p.price == null ? '' : String(p.price / 100));
  const [active, setActive] = useState(p.active ?? true);
  const [note, setNote] = useState('');
  const save = async (e) => {
    e.preventDefault();
    setNote('');
    try {
      await api(`/learning/staff/program/programs/${p.months}`, {
        method: 'PUT',
        body: {price: Math.round(Number(rupees) * 100), active},
      });
      setNote('Saved.');
      onSaved();
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };
  return (
    <form onSubmit={save} className="space-y-3 rounded-[18px] border border-rule p-5">
      <p className="text-xl">{p.months} months</p>
      <p className="text-sm text-muted">
        {p.price == null ? 'Not on sale' : `${inr(p.price / 100)}${p.active ? '' : ' · off sale'}`}
      </p>
      {canEdit && (
        <>
          <Field
            label="Price (₹)"
            type="number"
            min={0}
            required
            value={rupees}
            onChange={(e) => setRupees(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="size-4" checked={active} onChange={(e) => setActive(e.target.checked)} />{' '}
            On sale
          </label>
          <Button type="submit" variant="outline" icon={null}>
            Save
          </Button>
        </>
      )}
      {note && <p className="text-sm">{note}</p>}
    </form>
  );
}

function Enrolment({e, onChange}) {
  const [open, setOpen] = useState(false);
  const detail = useApi(open ? `/learning/staff/program/enrolments/${e._id}` : null);
  const [note, setNote] = useState('');
  const finish = async () => {
    if (!window.confirm(`Finish ${e.profile?.fullName ?? e.email}'s programme now and fix the mark?`)) return;
    try {
      await api(`/learning/staff/program/enrolments/${e._id}/finish`, {method: 'POST'});
      onChange();
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };
  const s = detail.data?.score;
  return (
    <details className="border-b border-rule" onToggle={(ev) => setOpen(ev.currentTarget.open)}>
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 py-4 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block font-medium">{e.profile?.fullName ?? e.email}</span>
          <span className="text-sm text-muted">
            {e.months} months · {e.profile?.track ?? 'no profile yet'} · ends {formatDay(e.endsAt)}
          </span>
        </span>
        <Tag tone={e.status === 'active' ? 'accent' : 'rule'}>
          {e.status === 'active' ? 'Running' : `${e.score?.total ?? 0}% · ${e.score?.grade ?? ''}`}
        </Tag>
      </summary>
      <div className="space-y-4 pb-6 text-sm">
        <p className="text-muted">
          {e.email} · skills: {e.profile?.skills?.join(', ') || '—'}
        </p>
        {s && (
          <p>
            Mark {s.total}% ({s.grade}): tasks {s.tasks}%, work {s.work}%, classes {s.attendance}%, lessons {s.lessons}%
          </p>
        )}
        {detail.data && (
          <p className="text-muted">
            {detail.data.tasks.length} practice tasks · {detail.data.work.length} pieces of paid work
          </p>
        )}
        {e.status === 'active' && (
          <Button variant="outline" icon={null} onClick={finish}>
            Finish now and issue the certificate
          </Button>
        )}
        {e.certificateCode && <p>Certificate {e.certificateCode}</p>}
        {note && <p>{note}</p>}
      </div>
    </details>
  );
}

const NEW_CLASS = {title: '', track: '', about: '', startsAt: '', minutes: '60', link: ''};

function Classes({tracks}) {
  const list = useApi('/learning/staff/program/classes');
  const ready = useApi('/learning/staff/program/video-ready');
  const [f, setF] = useState(NEW_CLASS);
  const [note, setNote] = useState('');
  const set = (k) => (e) => setF((x) => ({...x, [k]: e.target.value}));
  const add = async (e) => {
    e.preventDefault();
    setNote('');
    try {
      await api('/learning/staff/program/classes', {
        method: 'POST',
        body: {...f, minutes: Number(f.minutes), startsAt: new Date(f.startsAt).toISOString()},
      });
      setF(NEW_CLASS);
      list.reload();
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };
  return (
    <div className="space-y-6">
      <form onSubmit={add} className="space-y-4 rounded-[18px] border border-rule p-5">
        <p className="font-medium">Schedule a live class</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Field label="Title" required value={f.title} onChange={set('title')} />
          <Field label="Starts" type="datetime-local" required value={f.startsAt} onChange={set('startsAt')} />
          <Field label="Minutes" type="number" min={10} value={f.minutes} onChange={set('minutes')} />
          <Field label="Meet or Zoom link" type="url" required value={f.link} onChange={set('link')} />
          <label className="grid gap-1 text-sm">
            For
            <select value={f.track} onChange={set('track')} className={selectCls}>
              <option value="">Every intern</option>
              {tracks?.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <Field label="About (optional)" value={f.about} onChange={set('about')} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="accent" icon={null}>
            Schedule
          </Button>
          {note && <p className="text-sm">{note}</p>}
        </div>
      </form>
      {ready.data && !ready.data.ready && (
        <p className="text-sm text-muted">
          Recordings need video storage: set VIDEO_S3_* on the server (see .env.example).
        </p>
      )}
      <ul className="border-t border-rule">
        {list.data?.map((c) => (
          <li key={c._id} className="space-y-2 border-b border-rule py-4">
            <p className="font-medium">{c.title}</p>
            <p className="text-sm text-muted">
              {formatDate(c.startsAt)} · {c.minutes} min · {c.track || 'every intern'} ·{' '}
              <span className="break-all">{c.link}</span>
            </p>
            <VideoUpload
              path={`/learning/staff/program/classes/${c._id}/recording`}
              current={c.recording}
              onDone={list.reload}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Grade({t, onDone}) {
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [note, setNote] = useState('');
  const save = async (e) => {
    e.preventDefault();
    try {
      await api(`/learning/staff/program/tasks/${t._id}`, {method: 'PATCH', body: {grade: Number(grade), feedback}});
      onDone();
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };
  return (
    <li className="space-y-3 border-b border-rule py-5">
      <p className="font-medium">{t.title}</p>
      <p className="whitespace-pre-line text-sm">{t.answer}</p>
      {t.link && (
        <a href={t.link} target="_blank" rel="noreferrer noopener" className="break-all text-sm underline">
          {t.link}
        </a>
      )}
      <form onSubmit={save} className="flex flex-wrap items-end gap-3">
        <Field
          label="Grade (0–100)"
          type="number"
          min={0}
          max={100}
          required
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
        />
        <div className="min-w-56 grow">
          <Field label="Feedback" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
        </div>
        <Button type="submit" variant="outline" icon={null}>
          Grade
        </Button>
        {note && <p className="text-sm">{note}</p>}
      </form>
    </li>
  );
}

const TABS = {prices: 'Prices', enrolments: 'Enrolments', classes: 'Live classes', grading: 'Tasks to grade'};

export function Programme() {
  const {user} = useSession();
  const [tab, setTab] = useState('enrolments');
  const [q, setQ] = useState('');
  const programs = useApi(tab === 'prices' ? '/learning/staff/program/programs' : null);
  const enrolments = useApi(
    tab === 'enrolments' ? `/learning/staff/program/enrolments?q=${encodeURIComponent(q)}` : null,
  );
  const tasks = useApi(tab === 'grading' ? '/learning/staff/program/tasks' : null);
  const tracks = useApi('/learning/tracks');
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {Object.entries(TABS).map(([id, label]) => (
          <Button key={id} variant={tab === id ? 'primary' : 'outline'} icon={null} onClick={() => setTab(id)}>
            {label}
          </Button>
        ))}
      </div>
      {tab === 'prices' && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {programs.data?.map((p) => (
            <Price key={p.months} p={p} canEdit={user?.role === 'superadmin'} onSaved={programs.reload} />
          ))}
        </div>
      )}
      {tab === 'enrolments' && (
        <div className="space-y-4">
          <div className="max-w-sm">
            <Field label="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {enrolments.data?.length === 0 && <p className="text-muted">No one has joined yet.</p>}
          <div className="border-t border-rule">
            {enrolments.data?.map((e) => (
              <Enrolment key={e._id} e={e} onChange={enrolments.reload} />
            ))}
          </div>
        </div>
      )}
      {tab === 'classes' && <Classes tracks={tracks.data} />}
      {tab === 'grading' && (
        <div>
          {tasks.data?.length === 0 && (
            <p className="text-muted">Nothing waiting. The AI grades tasks when it is on.</p>
          )}
          <ul className="border-t border-rule">
            {tasks.data?.map((t) => (
              <Grade key={t._id} t={t} onDone={tasks.reload} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
