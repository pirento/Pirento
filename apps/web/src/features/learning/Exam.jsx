// The exam itself: questions, answers, submit.
import {useState} from 'react';
import {Button} from '../../components/ui/Button';
import {Countdown} from './Countdown';
import {api} from '../../lib/api/client';

export function Exam({exam, onDone}) {
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
