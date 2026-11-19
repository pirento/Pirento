import {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {Award, Timer} from 'lucide-react';
import {api, useApi, useSession} from '../lib/api';
import {usePageMotion} from '../lib/motion';
import {usePageMeta} from '../lib/page';
import {Button, Field, Label, Section, StatsRow, Tag} from '../components/ui';
import {PageHero} from './Products';
import {formatDate, useSignedIn} from './Orders';

function Countdown({endsAt, onEnd}) {
  const [left, setLeft] = useState(() => new Date(endsAt) - Date.now());
  useEffect(() => {
    const t = setInterval(() => {
      const ms = new Date(endsAt) - Date.now();
      setLeft(ms);
      if (ms <= 0) {
        clearInterval(t);
        onEnd();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [endsAt, onEnd]);
  const s = Math.max(0, Math.floor(left / 1000));
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border border-rule px-3 py-1 text-sm tabular-nums"
      role="timer"
    >
      <Timer aria-hidden className="size-4" />
      {String(Math.floor(s / 60)).padStart(2, '0')}:{String(s % 60).padStart(2, '0')} left
    </span>
  );
}

function Exam({exam, onDone}) {
  const [answers, setAnswers] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    if (busy) return;
    setBusy(true);
    try {
      onDone(await api(`/learning/exam/${exam.id}/submit`, {method: 'POST', body: {answers}}));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };
  const answered = Object.keys(answers).length;

  return (
    <div>
      <div className="sticky top-[76px] z-10 flex flex-wrap items-center justify-between gap-3 border-b border-rule bg-paper py-4">
        <p className="font-medium">
          {exam.trackName} · {answered}/{exam.questions.length} answered
        </p>
        <Countdown endsAt={exam.endsAt} onEnd={submit} />
      </div>
      <ol className="mt-8 space-y-10">
        {exam.questions.map((q, i) => (
          <li key={q.id}>
            <fieldset>
              <legend className="text-lg font-medium">
                <span className="text-muted tabular-nums">{String(i + 1).padStart(2, '0')} </span>
                {q.question}
              </legend>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {q.options.map((o, oi) => (
                  <label
                    key={o}
                    className={`cursor-pointer rounded-[14px] border px-4 py-3 text-[0.95rem] transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 ${
                      answers[q.id] === oi ? 'border-ink bg-ink text-paper' : 'border-rule hover:border-ink'
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      className="sr-only"
                      checked={answers[q.id] === oi}
                      onChange={() => setAnswers((a) => ({...a, [q.id]: oi}))}
                    />
                    {o}
                  </label>
                ))}
              </div>
            </fieldset>
          </li>
        ))}
      </ol>
      {error && (
        <p role="alert" className="mt-8 text-sm">
          ⚠ {error}
        </p>
      )}
      <Button onClick={submit} variant="accent" className="mt-10" disabled={busy}>
        {busy ? 'Submitting' : 'Submit exam'}
      </Button>
    </div>
  );
}

function StartForm({tracks, certified, onStart}) {
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

export function Intern() {
  const {redirect, user} = useSignedIn();
  const tracks = useApi('/learning/tracks');
  const me = useApi(user ? '/learning/me' : null);
  const [exam, setExam] = useState(null);
  const [result, setResult] = useState(null);
  const ref = useRef(null);
  usePageMotion(ref, [Boolean(tracks.data && me.data)]);
  usePageMeta({
    title: 'Pirento Intern — exam and certificates',
    description: 'Take the final exam and earn a certificate.',
  });
  if (redirect) return redirect;
  const certs = me.data?.certificates ?? [];

  return (
    <div ref={ref}>
      <PageHero
        label="Pirento Intern"
        title="Pass the exam. / Prove it anywhere."
        hl="Prove it anywhere."
        intro="Pick a track and take the final exam. Score 60% or more and you get a certificate with a public verify page."
      />
      <Section className="pt-0! md:pt-0!">
        {!exam && !result && (
          <div className="mb-16">
            <StatsRow
              stats={[
                {value: '10', label: 'questions per exam'},
                {value: '30', label: 'minutes on the clock'},
                {value: '60%', label: 'to pass'},
                {value: '24h', label: 'before a retake'},
              ]}
            />
          </div>
        )}
        {result ? (
          <div className="max-w-2xl rounded-[22px] border border-accent p-8" data-reveal>
            <Tag tone={result.passed ? 'accent' : 'rule'}>{result.passed ? 'Passed' : 'Not passed'}</Tag>
            <p className="num mt-6">{result.percent}%</p>
            {result.passed ? (
              <p className="body mt-4">
                Your certificate is ready:{' '}
                <Link to={`/verify/${result.certificate.code}`} className="text-ink underline underline-offset-4">
                  {result.certificate.code}
                </Link>
              </p>
            ) : (
              <p className="body mt-4">You need 60% to pass. You can try this track again in 24 hours.</p>
            )}
            <Button
              onClick={() => {
                setResult(null);
                me.reload();
              }}
              variant="outline"
              className="mt-8"
            >
              Back to tracks
            </Button>
          </div>
        ) : exam ? (
          <Exam
            exam={exam}
            onDone={(r) => {
              setExam(null);
              setResult(r);
            }}
          />
        ) : (
          tracks.data && (
            <StartForm tracks={tracks.data} certified={new Set(certs.map((c) => c.track))} onStart={setExam} />
          )
        )}
      </Section>
      {certs.length > 0 && !exam && (
        <Section className="pt-0! md:pt-0!">
          <Label n={1}>Your certificates</Label>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {certs.map((c) => (
              <li key={c.code} data-reveal>
                <Link
                  to={`/verify/${c.code}`}
                  className="flex items-center gap-5 rounded-[18px] border border-rule p-6 hover:border-ink"
                >
                  <Award aria-hidden className="size-6" />
                  <span>
                    <span className="block text-lg font-medium">{c.trackName}</span>
                    <span className="text-sm text-muted">
                      {c.code} · {c.percent}% · {formatDate(c.issuedAt)} · View certificate
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
