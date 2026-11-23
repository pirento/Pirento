// Checkout: fill the service's questions by chatting with Pirento AI instead of the form. When it has what it
// needs, its answers go into the form below, where the person checks them before paying.
import {useState} from 'react';
import {Sparkles} from 'lucide-react';
import {Button} from '../../components/ui/Button';
import {TextArea} from '../../components/ui/TextArea';
import {api} from '../../lib/api/client';

export function IntakeChat({slug, onAnswers}) {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const step = async (soFar) => {
    setError('');
    setBusy(true);
    try {
      const r = await api('/ai/assist/intake', {method: 'POST', body: {serviceSlug: slug, turns: soFar}});
      onAnswers(r.answers);
      if (r.done) setDone(true);
      else setQuestion(r.question);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  const reply = (e) => {
    e.preventDefault();
    const next = [...turns, {question, answer}];
    setTurns(next);
    setAnswer('');
    setQuestion('');
    step(next);
  };

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        icon={Sparkles}
        onClick={() => {
          setOpen(true);
          step([]);
        }}
      >
        Fill this with Pirento AI
      </Button>
    );
  }
  return (
    <div className="space-y-3 rounded-[18px] border border-rule p-5" aria-live="polite">
      {turns.map((t, i) => (
        <p key={i} className="text-sm">
          <span className="text-muted">{t.question}</span>
          <br />
          {t.answer}
        </p>
      ))}
      {question && (
        <form onSubmit={reply} className="space-y-3">
          <TextArea label={question} rows={2} value={answer} onChange={(e) => setAnswer(e.target.value)} />
          <Button type="submit" variant="accent" icon={null} disabled={busy || !answer.trim()}>
            Next
          </Button>
        </form>
      )}
      {busy && <p className="text-sm text-muted">Thinking…</p>}
      {done && <p className="text-sm">Done. Your answers are in the form below: check them, then continue.</p>}
      {error && (
        <p role="alert" className="text-sm">
          ⚠ {error}
        </p>
      )}
    </div>
  );
}
