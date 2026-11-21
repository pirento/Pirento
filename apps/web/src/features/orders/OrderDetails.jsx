// The questions a service asks after payment: the customer answers them on their order, the team reads them.
import {useState} from 'react';
import {needsDetails} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {Question} from './Question';
import {api} from '../../lib/api/client';
import {formatDate} from '../../lib/format';

/** The answers as a list, for the customer and the team. Nothing when there are none. */
export function DetailsRecord({order, className = ''}) {
  if (!order.detailsAt) return null;
  return (
    <dl className={className}>
      <p className="eyebrow">Details after payment · sent {formatDate(order.detailsAt)}</p>
      {order.afterQuestions
        .filter((q) => order.details?.[q.id])
        .map((q) => (
          <div key={q.id} className="mt-4 border-t border-rule pt-3">
            <dt className="text-sm text-muted">{q.label}</dt>
            <dd className="mt-1 break-words">{order.details[q.id]}</dd>
          </div>
        ))}
    </dl>
  );
}

/** The customer's form while the order is paid or in progress; their answers once sent, with a way to correct them. */
export function DetailsForm({order, onSaved}) {
  const live = ['paid', 'in_progress'].includes(order.status);
  const [editing, setEditing] = useState(false);
  const [answers, setAnswers] = useState(order.details ?? {});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (!order.afterQuestions?.length) return null;
  const box = 'rounded-[22px] border border-accent p-6 md:p-8';
  if (!needsDetails(order) && !editing)
    return (
      <div className="rounded-[22px] border border-rule p-6 md:p-8" data-reveal>
        <DetailsRecord order={order} />
        {live && (
          <button onClick={() => setEditing(true)} className="mt-5 text-sm underline underline-offset-4">
            Correct an answer
          </button>
        )}
      </div>
    );
  if (!live) return null;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      onSaved(await api(`/orders/${order._id}/details`, {method: 'PUT', body: {answers}}));
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form id="details" onSubmit={submit} noValidate className={`${box} space-y-6`} data-reveal>
      <div>
        <p className="eyebrow">Paid · a few details to start</p>
        <p className="mt-3 text-sm text-muted">The team needs these to begin work on your order.</p>
      </div>
      {order.afterQuestions.map((q) => (
        <Question key={q.id} q={q} value={answers[q.id]} onChange={(v) => setAnswers((a) => ({...a, [q.id]: v}))} />
      ))}
      {error && (
        <p role="alert" className="text-sm">
          ⚠ {error}
        </p>
      )}
      <Button type="submit" variant="accent" icon={null} disabled={busy}>
        {busy ? 'Sending' : 'Send to the team'}
      </Button>
    </form>
  );
}
