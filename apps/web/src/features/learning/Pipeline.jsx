// The applicants of Pirento Intern openings, worked by the team: shortlist, interview, offer, tasks, completion.
// Used twice: admin → Openings (every application) and a company's page (only its own), through `base`.
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {Tag} from '../../components/ui/Tag';
import {TextArea} from '../../components/ui/TextArea';
import {appDashboards} from '../../data/site';
import {api} from '../../lib/api/client';
import {saveFile} from '../../lib/api/binary';
import {useApi} from '../../lib/api/useApi';
import {formatDate, formatDay} from '../../lib/format';

const STATUS = appDashboards.intern.applicationStatus;
const LIVE = ['accepted', 'offered', 'interview'];
export const selectCls = 'rounded-full border border-rule bg-paper px-4 py-2.5 text-sm focus:border-ink';
const when = (d) => new Date(d).toLocaleString('en-IN', {dateStyle: 'medium', timeStyle: 'short'});

/** A small form that posts once and reports back; `fields` are [key, label, type]. */
function MiniForm({title, fields, submit, label}) {
  const [values, setValues] = useState({});
  const [note, setNote] = useState('');
  const send = async (e) => {
    e.preventDefault();
    setNote('');
    try {
      await submit(values);
      setValues({});
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };
  return (
    <form onSubmit={send} className="space-y-3 rounded-[18px] border border-rule p-5">
      <p className="font-medium">{title}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map(([k, l, type = 'text', required = false]) =>
          type === 'area' ? (
            <div key={k} className="sm:col-span-2">
              <TextArea
                label={l}
                required={required}
                rows={3}
                value={values[k] ?? ''}
                onChange={(e) => setValues((v) => ({...v, [k]: e.target.value}))}
              />
            </div>
          ) : (
            <Field
              key={k}
              label={l}
              type={type}
              required={required}
              value={values[k] ?? ''}
              onChange={(e) => setValues((v) => ({...v, [k]: e.target.value}))}
            />
          ),
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="outline" icon={null}>
          {label}
        </Button>
        {note && (
          <p role="alert" className="text-sm">
            {note}
          </p>
        )}
      </div>
    </form>
  );
}

function TaskReview({task, act}) {
  const [feedback, setFeedback] = useState('');
  return (
    <li className="space-y-2 border-b border-rule py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-medium">{task.title}</span>
        <Tag tone={task.status === 'submitted' ? 'accent' : 'rule'}>{task.status}</Tag>
      </div>
      {task.detail && <p className="whitespace-pre-line text-sm text-muted">{task.detail}</p>}
      {task.answer && <p className="whitespace-pre-line text-sm">{task.answer}</p>}
      {task.link && (
        <a href={task.link} target="_blank" rel="noreferrer noopener" className="break-all text-sm underline">
          {task.link}
        </a>
      )}
      {task.status === 'submitted' && (
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-56 grow">
            <Field label="Feedback (optional)" value={feedback} onChange={(e) => setFeedback(e.target.value)} />
          </div>
          <Button variant="accent" icon={null} onClick={() => act(task, 'approved', feedback)}>
            Approve
          </Button>
          <Button variant="outline" icon={null} onClick={() => act(task, 'redo', feedback)}>
            Ask again
          </Button>
        </div>
      )}
    </li>
  );
}

function Row({a, base, onChange}) {
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
  const move = (to, extra = {}) => api(`${base}/${a._id}/move`, {method: 'POST', body: {to, ...extra}});
  const reviewTask = (t, status, feedback) =>
    run(() => api(`${base}/${a._id}/tasks/${t._id}`, {method: 'PATCH', body: {status, feedback}}));
  const allApproved = a.tasks.length > 0 && a.tasks.every((t) => t.status === 'approved');

  return (
    <details className="border-b border-rule">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4 py-5 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block font-medium">{a.fullName ?? a.email}</span>
          <span className="text-sm text-muted">
            {a.opening?.title ?? 'A removed opening'}
            {a.opening?.company && ` · ${a.opening.company}`} · applied {formatDate(a.createdAt)}
          </span>
        </span>
        <Tag tone={LIVE.includes(a.status) ? 'accent' : 'rule'}>{STATUS[a.status]}</Tag>
      </summary>
      <div className="space-y-5 pb-8">
        <dl className="grid gap-2 text-sm sm:grid-cols-[10rem_1fr]">
          <dt className="text-muted">Email</dt>
          <dd className="break-all">{a.email}</dd>
          {a.links && (
            <>
              <dt className="text-muted">Links</dt>
              <dd className="break-all">{a.links}</dd>
            </>
          )}
          {a.note && (
            <>
              <dt className="text-muted">Why them</dt>
              <dd className="whitespace-pre-line">{a.note}</dd>
            </>
          )}
          {a.interview?.at && (
            <>
              <dt className="text-muted">Interview</dt>
              <dd>
                {when(a.interview.at)} {a.interview.link && `· ${a.interview.link}`}
              </dd>
            </>
          )}
          {a.offer?.start && (
            <>
              <dt className="text-muted">Offer</dt>
              <dd>
                Starts {formatDay(a.offer.start)} · {a.offer.weeks} weeks {a.offer.stipend && `· ${a.offer.stipend}`}
              </dd>
            </>
          )}
        </dl>
        <div className="flex flex-wrap gap-2">
          {a.hasResume && (
            <Button
              variant="outline"
              icon={null}
              onClick={() => run(() => saveFile(`${base}/${a._id}/resume`, `resume-${a.email}`))}
            >
              Download resume
            </Button>
          )}
          {a.status === 'new' && (
            <Button variant="accent" icon={null} onClick={() => run(() => move('shortlisted'))}>
              Shortlist
            </Button>
          )}
          {['new', 'shortlisted', 'interview', 'offered'].includes(a.status) && (
            <Button variant="outline" icon={null} onClick={() => run(() => move('declined'))}>
              {a.status === 'offered' ? 'Take back the offer' : 'Decline'}
            </Button>
          )}
          {a.status === 'accepted' && (
            <Button variant="accent" icon={null} disabled={!allApproved} onClick={() => run(() => move('completed'))}>
              Complete and issue certificate
            </Button>
          )}
          {a.certificateCode && (
            <Link to={`/verify/${a.certificateCode}`} className="self-center text-sm underline underline-offset-4">
              Certificate {a.certificateCode}
            </Link>
          )}
        </div>
        {note && (
          <p role="alert" className="text-sm">
            {note}
          </p>
        )}
        {['shortlisted', 'interview'].includes(a.status) && (
          <div className="grid gap-4 xl:grid-cols-2">
            <MiniForm
              title={a.status === 'interview' ? 'Move the interview' : 'Set an interview'}
              label="Send the time"
              fields={[
                ['at', 'Date and time', 'datetime-local', true],
                ['link', 'Meeting link or place'],
                ['note', 'Note for them', 'area'],
              ]}
              submit={(v) => move('interview', {interview: {...v, at: new Date(v.at).toISOString()}}).then(onChange)}
            />
            <MiniForm
              title="Make an offer"
              label="Send the offer"
              fields={[
                ['start', 'Start date', 'date', true],
                ['weeks', 'Weeks', 'number', true],
                ['stipend', 'Stipend (as written)'],
                ['note', 'Note for them', 'area'],
              ]}
              submit={(v) => move('offered', {offer: {...v, weeks: Number(v.weeks)}}).then(onChange)}
            />
          </div>
        )}
        {a.status === 'accepted' && (
          <>
            {a.tasks.length > 0 && (
              <ul className="border-t border-rule">
                {a.tasks.map((t) => (
                  <TaskReview key={t._id} task={t} act={reviewTask} />
                ))}
              </ul>
            )}
            <MiniForm
              title="Set a task"
              label="Add the task"
              fields={[
                ['title', 'Task', 'text', true],
                ['due', 'Due date', 'date'],
                ['detail', 'What to do', 'area'],
              ]}
              submit={(v) =>
                api(`${base}/${a._id}/tasks`, {method: 'POST', body: {...v, due: v.due || undefined}}).then(onChange)
              }
            />
          </>
        )}
      </div>
    </details>
  );
}

/** `base`: /learning/staff/applications or /learning/employer/applications. */
export function Pipeline({base, openingId}) {
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const query = new URLSearchParams({...(status && {status}), ...(q && {q}), ...(openingId && {openingId})});
  const list = useApi(`${base}?${query}`);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-sm">
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
        <div className="min-w-56">
          <Field label="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      {list.error && <p className="body">⚠ {list.error.message}</p>}
      {list.data?.length === 0 && <p className="text-muted">No applications here.</p>}
      <div className="border-t border-rule">
        {list.data?.map((a) => (
          <Row key={a._id} a={a} base={base} onChange={list.reload} />
        ))}
      </div>
    </div>
  );
}
