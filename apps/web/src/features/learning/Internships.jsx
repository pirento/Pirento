// Intern → Internships: every application with where it stands, the interview, the offer to answer, and once
// it runs, the tasks to send. A finished internship links to its certificate.
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {Tag} from '../../components/ui/Tag';
import {TextArea} from '../../components/ui/TextArea';
import {appDashboards} from '../../data/site';
import {api} from '../../lib/api/client';
import {formatDate, formatDay} from '../../lib/format';

const STATUS = appDashboards.intern.applicationStatus;
const when = (d) => new Date(d).toLocaleString('en-IN', {dateStyle: 'medium', timeStyle: 'short'});

function TaskItem({a, t, onChange}) {
  const [f, setF] = useState({answer: '', link: ''});
  const [note, setNote] = useState('');
  const send = async (e) => {
    e.preventDefault();
    setNote('');
    try {
      await api(`/learning/applications/${a._id}/tasks/${t._id}`, {method: 'POST', body: f});
      onChange();
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };
  const yours = ['open', 'redo'].includes(t.status);
  return (
    <li className="space-y-3 border-b border-rule py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="font-medium">{t.title}</span>
        <Tag tone={yours ? 'accent' : 'rule'}>
          {{open: 'To do', redo: 'Try again', submitted: 'Sent', approved: 'Approved'}[t.status]}
        </Tag>
      </div>
      {t.due && <p className="text-sm text-muted">Due {formatDay(t.due)}</p>}
      {t.detail && <p className="whitespace-pre-line text-sm">{t.detail}</p>}
      {t.feedback && <p className="text-sm text-muted">Feedback: {t.feedback}</p>}
      {yours && (
        <form onSubmit={send} className="space-y-3">
          <TextArea
            label="Your answer"
            required={false}
            rows={3}
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
              <p role="alert" className="text-sm">
                {note}
              </p>
            )}
          </div>
        </form>
      )}
    </li>
  );
}

function Application({a, onChange}) {
  const [note, setNote] = useState('');
  const answer = async (accept) => {
    setNote('');
    try {
      await api(`/learning/applications/${a._id}/answer`, {method: 'POST', body: {accept}});
      onChange();
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };
  return (
    <li className="rounded-[22px] border border-rule p-6 md:p-8" data-reveal>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xl font-medium">{a.opening?.title ?? 'A closed opening'}</p>
          <p className="text-sm text-muted">
            {a.opening?.company ?? 'Pirento'} · applied {formatDate(a.createdAt)}
          </p>
        </div>
        <Tag tone={['interview', 'offered', 'accepted'].includes(a.status) ? 'accent' : 'rule'}>{STATUS[a.status]}</Tag>
      </div>
      {a.status === 'interview' && a.interview?.at && (
        <div className="mt-5 rounded-[14px] border border-rule p-4 text-sm">
          <p className="font-medium">Interview: {when(a.interview.at)}</p>
          {a.interview.link && <p className="mt-1 break-all">{a.interview.link}</p>}
          {a.interview.note && <p className="mt-1 whitespace-pre-line text-muted">{a.interview.note}</p>}
        </div>
      )}
      {a.offer?.start && ['offered', 'accepted', 'completed'].includes(a.status) && (
        <div className="mt-5 rounded-[14px] border border-rule p-4 text-sm">
          <p className="font-medium">
            Offer: starts {formatDay(a.offer.start)} · {a.offer.weeks} weeks
            {a.offer.stipend && ` · ${a.offer.stipend}`}
          </p>
          {a.offer.note && <p className="mt-1 whitespace-pre-line text-muted">{a.offer.note}</p>}
          {a.status === 'offered' && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="accent" icon={null} onClick={() => answer(true)}>
                Accept the offer
              </Button>
              <Button variant="outline" icon={null} onClick={() => answer(false)}>
                Decline
              </Button>
            </div>
          )}
        </div>
      )}
      {note && (
        <p role="alert" className="mt-3 text-sm">
          {note}
        </p>
      )}
      {a.status === 'accepted' && (
        <div className="mt-6">
          <p className="eyebrow">Tasks</p>
          {a.tasks.length === 0 && <p className="mt-3 text-sm text-muted">Your first task will appear here.</p>}
          <ul className="mt-2">
            {a.tasks.map((t) => (
              <TaskItem key={t._id} a={a} t={t} onChange={onChange} />
            ))}
          </ul>
        </div>
      )}
      {a.certificateCode && (
        <Link to={`/verify/${a.certificateCode}`} className="mt-5 inline-block text-sm underline underline-offset-4">
          Your internship certificate · {a.certificateCode}
        </Link>
      )}
    </li>
  );
}

export function Internships({apps}) {
  if (apps.data?.length === 0) {
    return (
      <p className="text-muted">
        No applications yet.{' '}
        <Link to="/intern/dashboard/openings" className="underline underline-offset-4">
          See the openings
        </Link>
      </p>
    );
  }
  return (
    <ul className="space-y-4">
      {apps.data?.map((a) => (
        <Application key={a._id} a={a} onChange={apps.reload} />
      ))}
    </ul>
  );
}
