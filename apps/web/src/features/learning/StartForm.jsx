// Choose a track and the name for the certificate.
import {useState} from 'react';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {api} from '../../lib/api/client';
import {useSession} from '../../lib/api/session';

export function StartForm({tracks, certified, onStart}) {
  const {user} = useSession();
  const [track, setTrack] = useState('');
  const [fullName, setFullName] = useState(user?.name ?? '');
  const [error, setError] = useState('');
  const start = async (e) => {
    e.preventDefault();
    setError('');
    try {
      onStart(await api('/learning/exam/start', {method: 'POST', body: {track, fullName}}));
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <form onSubmit={start} noValidate className="max-w-2xl space-y-8" data-reveal>
      <fieldset>
        <legend className="text-sm font-medium">
          Track <span className="text-muted">(required)</span>
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {tracks.map((t) => (
            <label
              key={t.slug}
              className={`cursor-pointer rounded-full border px-4 py-2 text-sm has-focus-visible:outline-2 has-focus-visible:outline-offset-2 ${
                track === t.slug ? 'border-ink bg-ink text-paper' : 'border-rule hover:border-ink'
              } ${certified.has(t.slug) ? 'opacity-50' : ''}`}
            >
              <input
                type="radio"
                name="track"
                className="sr-only"
                disabled={certified.has(t.slug)}
                checked={track === t.slug}
                onChange={() => setTrack(t.slug)}
              />
              {t.name}
              {certified.has(t.slug) && ' · passed'}
            </label>
          ))}
        </div>
      </fieldset>
      <Field
        label="Name on the certificate"
        required
        autoComplete="name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        error={error}
      />
      <Button type="submit" variant="accent" disabled={!track}>
        Start the 30-minute exam
      </Button>
    </form>
  );
}
