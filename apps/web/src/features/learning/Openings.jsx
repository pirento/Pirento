// Open internships and jobs on the Pirento Intern site, with a short application.
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {Button} from '../../components/ui/Button';
import {TextArea} from '../../components/ui/TextArea';
import {api} from '../../lib/api/client';
import {useSession} from '../../lib/api/session';
import {useApi} from '../../lib/api/useApi';

const MODE = {remote: 'Remote', onsite: 'On site', hybrid: 'Hybrid'};
const STATUS = {new: 'Applied', shortlisted: 'Shortlisted', declined: 'Not this time'};

function Opening({o, applied, signedIn, onApplied}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const apply = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api(`/learning/openings/${o._id}/apply`, {method: 'POST', body: {note}});
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
      <p className="mt-3 whitespace-pre-line text-muted">{o.description}</p>
      <div className="mt-6">
        {applied ? (
          <p className="text-sm">{STATUS[applied]}</p>
        ) : !signedIn ? (
          <Button to="/login?next=/intern" variant="outline">
            Sign in to apply
          </Button>
        ) : open ? (
          <form onSubmit={apply} className="space-y-3">
            <TextArea
              required={false}
              label="Why you? (optional, a few lines)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            {error && (
              <p role="alert" className="text-sm">
                ⚠ {error}
              </p>
            )}
            <Button type="submit" variant="accent">
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

export function Openings() {
  const {user} = useSession();
  const list = useApi('/learning/openings');
  const mine = useApi(user ? '/learning/openings/mine' : null);
  if (!list.data?.length) return null;
  const appliedTo = Object.fromEntries((mine.data ?? []).map((a) => [a.openingId, a.status]));
  return (
    <div className="mt-20">
      <h3 className="text-2xl">Open roles</h3>
      <p className="mt-2 text-muted">
        Posted by the Pirento team. A certificate from the track helps;{' '}
        <Link to="/intern/dashboard" className="underline underline-offset-4">
          take the exam
        </Link>
        .
      </p>
      <ul className="mt-6 grid gap-4 md:grid-cols-2">
        {list.data.map((o) => (
          <Opening key={o._id} o={o} applied={appliedTo[o._id]} signedIn={Boolean(user)} onApplied={mine.reload} />
        ))}
      </ul>
    </div>
  );
}
