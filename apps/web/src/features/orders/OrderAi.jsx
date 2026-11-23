// Pirento AI on a customer's own order (Legal tools 5–7): where it stands in plain words, a question about it, and
// for a consultation, a brief for the lawyer that the customer can send on the order.
import {useState} from 'react';
import {Sparkles} from 'lucide-react';
import {getService} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {TextArea} from '../../components/ui/TextArea';
import {api} from '../../lib/api/client';
import {AiResult} from '../ai/AiTool';

export function OrderAi({order, onSent}) {
  const [result, setResult] = useState(null);
  const [question, setQuestion] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const consult = getService(order.serviceSlug)?.model === 'consult';

  const run = async (kind, body) => {
    setError('');
    setBusy(true);
    try {
      setResult({kind, value: await api(`/ai/assist/${kind}`, {method: 'POST', body: {orderId: order._id, ...body}})});
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  const sendBrief = async () => {
    setError('');
    try {
      await api(`/orders/${order._id}/messages`, {method: 'POST', body: {body: result.value.brief.slice(0, 4000)}});
      setResult(null);
      setNotes('');
      onSent?.();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-4 rounded-[22px] border border-rule p-8" data-reveal>
      <p className="flex items-center gap-2 font-medium">
        <Sparkles aria-hidden className="size-4" /> Pirento AI on this order
      </p>
      <Button variant="outline" icon={null} disabled={busy} onClick={() => run('orderStatus')}>
        Where is my order?
      </Button>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (question.trim()) run('orderAsk', {question});
        }}
        className="flex flex-wrap items-end gap-2"
      >
        <div className="min-w-0 grow">
          <Field label="Ask about this order" value={question} onChange={(e) => setQuestion(e.target.value)} />
        </div>
        <Button type="submit" variant="outline" icon={null} disabled={busy || !question.trim()}>
          Ask
        </Button>
      </form>
      {consult && (
        <div className="space-y-2">
          <TextArea
            label="Before your call: what happened, and what you want to ask"
            required={false}
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Button
            variant="outline"
            icon={null}
            disabled={busy || notes.trim().length < 10}
            onClick={() => run('consultBrief', {notes})}
          >
            Make a brief for the lawyer
          </Button>
        </div>
      )}
      {busy && <p className="text-sm text-muted">Thinking…</p>}
      {result && (
        <div className="space-y-3 border-t border-rule pt-4 text-sm" aria-live="polite">
          <AiResult value={result.value} />
          {result.kind === 'consultBrief' && (
            <Button variant="accent" icon={null} onClick={sendBrief}>
              Send this brief to the lawyer
            </Button>
          )}
          <p className="text-xs text-muted">Written by AI from your order. The team's messages are what count.</p>
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
