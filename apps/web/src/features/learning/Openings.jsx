// Open internships and jobs on the Pirento Intern site, with the application: name, resume, links and a note.
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {TextArea} from '../../components/ui/TextArea';
import {appDashboards} from '../../data/site';
import {api} from '../../lib/api/client';
import {mb, saveFile, uploadFile} from '../../lib/api/binary';
import {useSession} from '../../lib/api/session';
import {useApi} from '../../lib/api/useApi';

const MODE = {remote: 'Remote', onsite: 'On site', hybrid: 'Hybrid'};
const STATUS = appDashboards.intern.applicationStatus;

/** The one resume sent with every application: upload, replace or download it. */
export function ResumeBox({resume}) {
  const [note, setNote] = useState('');
  const send = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setNote('Uploading…');
    try {
      await uploadFile('/learning/resume', file);
      setNote('');
      resume.reload();
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[14px] border border-rule p-4 text-sm">
      <span className="mr-auto min-w-0">
        <span className="block font-medium">Resume</span>
        {resume.data ? (
          <button
            type="button"
            className="break-all text-muted underline underline-offset-4"
            onClick={() => saveFile('/learning/resume/file', resume.data.name)}
          >
            {resume.data.name} · {mb(resume.data.size)}
          </button>
        ) : (
          <span className="text-muted">PDF or Word, up to 2 MB. Sent with every application.</span>
        )}
      </span>
      <label className="cursor-pointer rounded-full border border-rule px-4 py-2 hover:border-ink has-focus-visible:outline-2">
        {resume.data ? 'Replace' : 'Add resume'}
        <input type="file" accept=".pdf,.doc,.docx" className="sr-only" onChange={send} />
      </label>
      {note && (
        <p role="status" className="w-full">
          {note}
        </p>
      )}
    </div>
  );
}

function Opening({o, applied, user, resume, onApplied}) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({fullName: user?.name ?? '', links: '', note: ''});
  const [error, setError] = useState('');
  const set = (k) => (e) => setF((x) => ({...x, [k]: e.target.value}));
  const apply = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api(`/learning/openings/${o._id}/apply`, {method: 'POST', body: f});
      setOpen(false);
      onApplied();
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <li className="rounded-[22px] border border-rule p-8" data-reveal>
      <p className="eyebrow">
        {o.kind === 'job' ? 'Job' : 'Internship'} · {MODE[o.mode]}
        {o.location && ` · ${o.location}`}
      </p>
      <h4 className="mt-4 text-2xl">{o.title}</h4>
      <p className="mt-2 text-sm text-muted">
        {o.employerId ? (
          <Link to={`/intern/companies/${o.employerId}`} className="underline underline-offset-4">
            {o.company}
          </Link>
        ) : (
          'Pirento'
        )}
        {o.weeks && ` · ${o.weeks} weeks`}
        {o.stipend && ` · ${o.stipend}`}
      </p>
      <p className="mt-3 whitespace-pre-line text-muted">{o.description}</p>
      <div className="mt-6">
        {applied ? (
          <p className="text-sm">{STATUS[applied]}</p>
        ) : !user ? (
          <Button to="/login?next=/intern/dashboard/openings" variant="outline">
            Sign in to apply
          </Button>
        ) : open ? (
          <form onSubmit={apply} className="space-y-4">
            <Field label="Your full name" required value={f.fullName} onChange={set('fullName')} />
            <ResumeBox resume={resume} />
            <Field label="Links (portfolio, GitHub, LinkedIn)" value={f.links} onChange={set('links')} />
            <TextArea required={false} label="Why you? (a few lines)" value={f.note} onChange={set('note')} />
            {error && (
              <p role="alert" className="text-sm">
                ⚠ {error}
              </p>
            )}
            <Button type="submit" variant="accent" disabled={!resume.data}>
              Send application
            </Button>
          </form>
        ) : (
          <Button variant="outline" onClick={() => setOpen(true)}>
            Apply
          </Button>
        )}
      </div>
    </li>
  );
}

/** One opening on its own (a company's page), with the person's own application state. */
export function OpeningCard({o}) {
  const {user} = useSession();
  const mine = useApi(user ? '/learning/openings/mine' : null);
  const resume = useApi(user ? '/learning/resume' : null);
  const applied = mine.data?.find((a) => a.openingId === o._id)?.status;
  return <Opening o={o} applied={applied} user={user} resume={resume} onApplied={mine.reload} />;
}

export function Openings({bare = false}) {
  const {user} = useSession();
  const list = useApi('/learning/openings');
  const mine = useApi(user ? '/learning/openings/mine' : null);
  const resume = useApi(user ? '/learning/resume' : null);
  if (!list.data?.length) return null;
  const appliedTo = Object.fromEntries((mine.data ?? []).map((a) => [a.openingId, a.status]));
  return (
    <div className={bare ? '' : 'mt-20'}>
      {!bare && (
        <>
          <h3 className="text-2xl">Open roles</h3>
          <p className="mt-2 text-muted">
            Posted by Pirento and approved companies. A certificate from the track helps;{' '}
            <Link to="/intern/dashboard/exams" className="underline underline-offset-4">
              take the exam
            </Link>
            .
          </p>
        </>
      )}
      <ul className={`grid gap-4 md:grid-cols-2 ${bare ? '' : 'mt-6'}`}>
        {list.data.map((o) => (
          <Opening key={o._id} o={o} applied={appliedTo[o._id]} user={user} resume={resume} onApplied={mine.reload} />
        ))}
      </ul>
    </div>
  );
}
