// Admin → Intern work: paid work from across Pirento (Ecosystem, Foundation, every product). Post it, let the AI
// suggest the intern who fits (with its reason), confirm, review what comes back, and approval pays their wallet.
import {useState} from 'react';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {Tag} from '../../components/ui/Tag';
import {TextArea} from '../../components/ui/TextArea';
import {PRODUCTS} from '@pirento/shared';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {formatDay, inr} from '../../lib/format';
import {selectCls} from '../learning/Pipeline';

const SOURCES = ['Pirento Ecosystem', 'Pirento Foundation', ...PRODUCTS.map((p) => p.name)];
const EMPTY = {title: '', brief: '', source: SOURCES[0], track: '', skills: '', pay: '', due: ''};
const STATUS = {
  open: 'Open',
  assigned: 'With the intern',
  submitted: 'To review',
  redo: 'Sent back',
  approved: 'Approved',
};

function NewWork({tracks, onDone}) {
  const [f, setF] = useState(EMPTY);
  const [note, setNote] = useState('');
  const set = (k) => (e) => setF((x) => ({...x, [k]: e.target.value}));
  const add = async (e) => {
    e.preventDefault();
    setNote('');
    try {
      await api('/learning/staff/program/work', {
        method: 'POST',
        body: {
          ...f,
          pay: Math.round(Number(f.pay) * 100),
          skills: f.skills
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          due: f.due || undefined,
        },
      });
      setF(EMPTY);
      onDone();
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };
  return (
    <form onSubmit={add} className="space-y-4 rounded-[22px] border border-rule p-6">
      <p className="eyebrow">New paid work</p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Field label="Title" required value={f.title} onChange={set('title')} />
        <label className="grid gap-1 text-sm">
          For
          <select value={f.source} onChange={set('source')} className={selectCls}>
            {SOURCES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm">
          Track
          <select value={f.track} onChange={set('track')} className={selectCls}>
            <option value="">Any</option>
            {tracks?.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
        <Field label="Skills, separated by commas" value={f.skills} onChange={set('skills')} />
        <Field label="Pay (₹, on approval)" type="number" min={0} required value={f.pay} onChange={set('pay')} />
        <Field label="Due (optional)" type="date" value={f.due} onChange={set('due')} />
      </div>
      <TextArea label="What to do" value={f.brief} onChange={set('brief')} />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="accent">
          Post work
        </Button>
        {note && <p className="text-sm">{note}</p>}
      </div>
    </form>
  );
}

function Row({w, onChange}) {
  const [grade, setGrade] = useState(w.aiReview?.grade != null ? String(w.aiReview.grade) : '');
  const [feedback, setFeedback] = useState('');
  const [note, setNote] = useState('');
  const run = async (fn) => {
    setNote('');
    try {
      await fn();
      onChange();
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };
  const base = `/learning/staff/program/work/${w._id}`;
  const review = (status) =>
    run(() => api(`${base}/review`, {method: 'PATCH', body: {status, grade: Number(grade), feedback}}));
  return (
    <details className="border-b border-rule">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 py-4 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block font-medium">{w.title}</span>
          <span className="text-sm text-muted">
            {w.source} · {inr(w.pay / 100)}
            {w.due && ` · due ${formatDay(w.due)}`}
            {w.assignee && ` · ${w.assignee.name ?? w.assignee.email}`}
          </span>
        </span>
        <Tag tone={w.status === 'submitted' ? 'accent' : 'rule'}>
          {STATUS[w.status]}
          {w.status === 'approved' && !w.paid && ' · not paid'}
        </Tag>
      </summary>
      <div className="space-y-4 pb-6 text-sm">
        <p className="whitespace-pre-line">{w.brief}</p>
        {w.status === 'open' && (
          <div className="space-y-3">
            {w.suggestion ? (
              <div className="rounded-[14px] border border-rule p-4">
                <p className="font-medium">
                  Suggested: {w.suggestion.name}{' '}
                  {w.suggestion.by === 'rule' && <span className="text-muted">(by rule)</span>}
                </p>
                <p className="mt-1 text-muted">{w.suggestion.reason}</p>
                <Button
                  className="mt-3"
                  variant="accent"
                  icon={null}
                  onClick={() =>
                    run(() => api(`${base}/assign`, {method: 'POST', body: {userId: w.suggestion.userId}}))
                  }
                >
                  Assign to {w.suggestion.name}
                </Button>
              </div>
            ) : null}
            <Button variant="outline" icon={null} onClick={() => run(() => api(`${base}/suggest`, {method: 'POST'}))}>
              {w.suggestion ? 'Suggest again' : 'Ask the AI who fits'}
            </Button>
          </div>
        )}
        {(w.answer || w.link) && (
          <div className="rounded-[14px] border border-rule p-4">
            <p className="whitespace-pre-line">{w.answer}</p>
            {w.link && (
              <a href={w.link} target="_blank" rel="noreferrer noopener" className="break-all underline">
                {w.link}
              </a>
            )}
          </div>
        )}
        {w.aiReview && (
          <div className="rounded-[14px] border border-rule p-4">
            <p className="font-medium">AI review: {w.aiReview.grade}/100</p>
            <p className="mt-1">{w.aiReview.feedback}</p>
            {w.aiReview.problems?.length > 0 && (
              <ul className="mt-2 list-disc pl-5 text-muted">
                {w.aiReview.problems.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            )}
          </div>
        )}
        {w.status === 'submitted' && (
          <div className="flex flex-wrap items-end gap-3">
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
              <Field label="Feedback to the intern" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
            </div>
            <Button variant="accent" icon={null} disabled={grade === ''} onClick={() => review('approved')}>
              Approve and pay {inr(w.pay / 100)}
            </Button>
            <Button variant="outline" icon={null} disabled={grade === ''} onClick={() => review('redo')}>
              Send back
            </Button>
          </div>
        )}
        {w.status === 'approved' && !w.paid && (
          <Button variant="outline" icon={null} onClick={() => run(() => api(`${base}/pay`, {method: 'POST'}))}>
            Pay again
          </Button>
        )}
        {w.status === 'approved' && w.paid && (
          <p className="text-muted">
            Paid · grade {w.grade} · approved by {w.approvedBy}
          </p>
        )}
        {note && <p>{note}</p>}
      </div>
    </details>
  );
}

export function InternWork() {
  const [status, setStatus] = useState('');
  const list = useApi(`/learning/staff/program/work${status ? `?status=${status}` : ''}`);
  const tracks = useApi('/learning/tracks');
  return (
    <div className="space-y-8">
      <NewWork tracks={tracks.data} onDone={list.reload} />
      <label className="grid w-fit gap-1 text-sm">
        Status
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectCls}>
          <option value="">All</option>
          {Object.entries(STATUS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
      </label>
      {list.error && <p className="body">⚠ {list.error.message}</p>}
      {list.data?.length === 0 && <p className="text-muted">No work here.</p>}
      <div className="border-t border-rule">
        {list.data?.map((w) => (
          <Row key={w._id} w={w} onChange={list.reload} />
        ))}
      </div>
    </div>
  );
}
