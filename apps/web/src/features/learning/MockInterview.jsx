// Intern → Learn: a five-question mock interview with Pirento AI for a track, then a score with strengths and what
// to improve. The conversation lives only in this page; each turn is one AI message from the daily allowance.
import {useState} from 'react';
import {Button} from '../../components/ui/Button';
import {TextArea} from '../../components/ui/TextArea';
import {api} from '../../lib/api/client';
import {selectCls} from './Pipeline';
import {AiResult} from '../ai/AiTool';

export function MockInterview({tracks}) {
  const [track, setTrack] = useState('');
  const [turns, setTurns] = useState([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const ask = async (soFar) => {
    setError('');
    setBusy(true);
    try {
      const r = await api('/ai/assist/interview', {method: 'POST', body: {track, turns: soFar}});
      if (r.score >= 0) setResult(r);
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
    ask(next);
  };
  const reset = () => {
    setTurns([]);
    setQuestion('');
    setResult(null);
  };

  return (
    <div className="max-w-3xl space-y-4">
      {!question && !result && (
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-sm">
            Track
            <select value={track} onChange={(e) => setTrack(e.target.value)} className={selectCls}>
              <option value="">Choose</option>
              {tracks?.map((t) => (
                <option key={t.slug} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <Button variant="outline" disabled={!track || busy} onClick={() => ask([])}>
            {busy ? 'Starting…' : 'Start the interview'}
          </Button>
        </div>
      )}
      {question && (
        <form onSubmit={reply} className="space-y-3 rounded-[18px] border border-rule p-5">
          <p className="text-sm text-muted">Question {turns.length + 1} of 5</p>
          <p className="text-lg">{question}</p>
          <TextArea label="Your answer" rows={4} value={answer} onChange={(e) => setAnswer(e.target.value)} />
          <Button type="submit" variant="accent" icon={null} disabled={busy || !answer.trim()}>
            {busy ? 'Reading…' : turns.length === 4 ? 'Finish' : 'Next question'}
          </Button>
        </form>
      )}
      {result && (
        <div className="space-y-4 rounded-[18px] border border-rule p-5">
          <p className="num">{result.score}/100</p>
          <AiResult value={{feedback: result.feedback, strengths: result.strengths, improve: result.improve}} />
          <Button variant="outline" icon={null} onClick={reset}>
            Try again
          </Button>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm">
          ⚠ {error}
        </p>
      )}
    </div>
  );
}
