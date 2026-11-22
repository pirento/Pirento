// The intern's working pages on the programme: daily/weekly/monthly practice tasks, live classes with their
// recordings, and paid work. Every review shows its grade, what went wrong and the lessons to watch for it.
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {Button} from '../../components/ui/Button';
import {DashSection} from '../../components/ui/DashSection';
import {Field} from '../../components/ui/Field';
import {Tag} from '../../components/ui/Tag';
import {TextArea} from '../../components/ui/TextArea';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {formatDate, formatDay, inr} from '../../lib/format';
import {VideoPlayer} from './Video';

const CADENCE = {daily: 'Today', weekly: 'This week', monthly: 'This month'};

/** An answer box: text and an optional link, posted to `path`. */
function AnswerForm({path, onSent}) {
  const [f, setF] = useState({answer: '', link: ''});
  const [note, setNote] = useState('');
  const send = async (e) => {
    e.preventDefault();
    setNote('Sending…');
    try {
      await api(path, {method: 'POST', body: f});
      setNote('');
      onSent();
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };
  return (
    <form onSubmit={send} className="space-y-3">
      <TextArea
        label="Your answer"
        required={false}
        rows={4}
        value={f.answer}
        onChange={(e) => setF((x) => ({...x, answer: e.target.value}))}
      />
      <Field
        label="Link (optional, https://…)"
        type="url"
        value={f.link}
        onChange={(e) => setF((x) => ({...x, link: e.target.value}))}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="accent" icon={null}>
          Send
        </Button>
        {note && (
          <p role="status" className="text-sm">
            {note}
          </p>
        )}
      </div>
    </form>
  );
}

/** Grade, feedback, problems and the lessons that fix them. */
function Review({grade, feedback, problems = [], lessonIds = [], by}) {
  return (
    <div className="space-y-2 rounded-[14px] border border-rule p-4 text-sm">
      {grade != null && (
        <p className="font-medium">
          {grade}/100 {by && <span className="text-muted">· reviewed by {by === 'ai' ? 'the AI' : 'the team'}</span>}
        </p>
      )}
      {feedback && <p className="whitespace-pre-line">{feedback}</p>}
      {problems.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-muted">
          {problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}
      {lessonIds.length > 0 && (
        <p>
          Watch:{' '}
          {lessonIds.map((id, i) => (
            <span key={id}>
              {i > 0 && ', '}
              <Link to={`/intern/dashboard/learn?lesson=${id}`} className="underline underline-offset-4">
                lesson {i + 1}
              </Link>
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

function TaskCard({t, onChange}) {
  const open = t.status === 'open' && new Date(t.due) > new Date();
  return (
    <li className="space-y-4 rounded-[22px] border border-rule p-6" data-reveal>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="eyebrow">
          {CADENCE[t.cadence] ?? t.cadence} · due {formatDate(t.due)}
        </p>
        <Tag tone={open ? 'accent' : 'rule'}>{open ? 'To do' : t.status === 'graded' ? 'Graded' : t.status}</Tag>
      </div>
      <p className="text-xl">{t.title}</p>
      {t.detail && <p className="whitespace-pre-line text-sm">{t.detail}</p>}
      {t.lessonIds?.length > 0 && <Review lessonIds={t.lessonIds} />}
      {open && <AnswerForm path={`/learning/program/tasks/${t._id}/submit`} onSent={onChange} />}
      {t.status === 'submitted' && <p className="text-sm text-muted">Sent. The team will grade it.</p>}
      {t.status === 'graded' && (
        <Review
          grade={t.grade}
          feedback={t.feedback}
          problems={t.problems}
          lessonIds={t.reviewLessonIds}
          by={t.gradedBy === 'ai' ? 'ai' : 'team'}
        />
      )}
    </li>
  );
}

export function Tasks() {
  const list = useApi('/learning/program/tasks');
  if (list.error) {
    return (
      <p className="body">
        ⚠ {list.error.message}{' '}
        <Link to="/intern/dashboard/programme" className="underline underline-offset-4">
          Open your programme
        </Link>
      </p>
    );
  }
  if (!list.data) return <p className="text-muted">Preparing your tasks…</p>;
  return (
    <>
      <DashSection n={1} id="now" label="Now" title="Today, this week, / this month.">
        <ul className="grid gap-4 xl:grid-cols-3">
          {list.data.current.map((t) => (
            <TaskCard key={t._id} t={t} onChange={list.reload} />
          ))}
        </ul>
      </DashSection>
      {list.data.past.length > 0 && (
        <DashSection n={2} id="past" label="Before" title="Every task, / with its grade.">
          <ul className="border-t border-rule">
            {list.data.past.map((t) => (
              <li key={t._id} className="flex flex-wrap items-center justify-between gap-3 border-b border-rule py-4">
                <span className="min-w-0">
                  <span className="block font-medium">{t.title}</span>
                  <span className="text-sm text-muted">
                    {CADENCE[t.cadence]} · {t.period}
                  </span>
                </span>
                <span className="tabular-nums">{t.status === 'graded' ? `${t.grade}/100` : t.status}</span>
              </li>
            ))}
          </ul>
        </DashSection>
      )}
    </>
  );
}

function ClassRow({c, onJoined}) {
  const [note, setNote] = useState('');
  const start = new Date(c.startsAt);
  const end = new Date(start.getTime() + c.minutes * 60_000);
  const past = end < new Date();
  const join = async () => {
    setNote('');
    try {
      const {link} = await api(`/learning/classes/${c._id}/join`, {method: 'POST'});
      window.open(link, '_blank', 'noopener');
      onJoined();
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };
  return (
    <li className="space-y-3 border-b border-rule py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="min-w-0">
          <span className="block font-medium">{c.title}</span>
          <span className="text-sm text-muted">
            {formatDate(c.startsAt)} · {c.minutes} min
          </span>
        </span>
        {c.attended ? <Tag>Attended</Tag> : !past && <Tag tone="accent">Upcoming</Tag>}
      </div>
      {c.about && <p className="text-sm text-muted">{c.about}</p>}
      {!past && (
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={join}>
            Join the class
          </Button>
          {note && <p className="text-sm">{note}</p>}
        </div>
      )}
      {c.hasRecording && <VideoPlayer path={`/learning/classes/${c._id}/recording`} label="Watch the recording" />}
    </li>
  );
}

export function Classes() {
  const list = useApi('/learning/classes');
  if (list.error) return <p className="body">⚠ {list.error.message}</p>;
  const now = Date.now();
  const upcoming = list.data?.filter((c) => new Date(c.startsAt).getTime() + c.minutes * 60_000 >= now) ?? [];
  const past = list.data?.filter((c) => !upcoming.includes(c)).reverse() ?? [];
  return (
    <>
      <DashSection n={1} id="upcoming" label="Live" title="Classes / coming up.">
        {list.data && upcoming.length === 0 && <p className="text-muted">No class scheduled yet.</p>}
        <ul className="border-t border-rule">
          {upcoming.map((c) => (
            <ClassRow key={c._id} c={c} onJoined={list.reload} />
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted">The link opens ten minutes before; joining counts as attending.</p>
      </DashSection>
      {past.length > 0 && (
        <DashSection n={2} id="recordings" label="Recordings" title="Missed one? / Watch it.">
          <ul className="border-t border-rule">
            {past.map((c) => (
              <ClassRow key={c._id} c={c} onJoined={list.reload} />
            ))}
          </ul>
        </DashSection>
      )}
    </>
  );
}

const WORK_STATUS = {assigned: 'To do', redo: 'Try again', submitted: 'In review', approved: 'Approved'};

export function PaidWork() {
  const list = useApi('/learning/work/mine');
  if (list.error) return <p className="body">⚠ {list.error.message}</p>;
  if (list.data?.length === 0) {
    return (
      <p className="text-muted">
        No paid work yet. Once you are eligible (see{' '}
        <Link to="/intern/dashboard/programme" className="underline underline-offset-4">
          Programme
        </Link>
        ), work from across Pirento is matched to you here.
      </p>
    );
  }
  return (
    <ul className="space-y-4">
      {list.data?.map((w) => (
        <li key={w._id} className="space-y-4 rounded-[22px] border border-rule p-6" data-reveal>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="eyebrow">
                {w.source}
                {w.due && ` · due ${formatDay(w.due)}`}
              </p>
              <p className="mt-2 text-xl">{w.title}</p>
            </div>
            <span className="flex items-center gap-2">
              <span className="tabular-nums">{inr(w.pay / 100)}</span>
              <Tag tone={['assigned', 'redo'].includes(w.status) ? 'accent' : 'rule'}>{WORK_STATUS[w.status]}</Tag>
            </span>
          </div>
          <p className="whitespace-pre-line text-sm">{w.brief}</p>
          {w.feedback && <Review grade={w.status === 'approved' ? w.grade : null} feedback={w.feedback} by="team" />}
          {w.aiReview && w.status !== 'approved' && (
            <Review
              grade={w.aiReview.grade}
              feedback={w.aiReview.feedback}
              problems={w.aiReview.problems}
              lessonIds={w.aiReview.lessonIds}
              by="ai"
            />
          )}
          {['assigned', 'redo'].includes(w.status) && (
            <AnswerForm path={`/learning/work/${w._id}/submit`} onSent={list.reload} />
          )}
          {w.status === 'approved' && (
            <p className="text-sm">
              {w.paid ? `${inr(w.pay / 100)} is in your wallet.` : 'Approved; the payment is on its way.'}{' '}
              <Link to="/intern/dashboard/wallet" className="underline underline-offset-4">
                Wallet
              </Link>
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
