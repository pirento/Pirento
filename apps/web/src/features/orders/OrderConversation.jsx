// The conversation on one order between its customer and the team, with a box to write the next message.
import {useState} from 'react';
import {api} from '../../lib/api/client';
import {formatDate} from '../../lib/format';

/** `side` is who is reading; `send(body)` posts the message and returns the updated order. */
export function OrderConversation({order, side, send}) {
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const messages = order.messages ?? [];

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await send(body.trim());
      setBody('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {messages.length === 0 ? (
        <p className="text-muted">
          {side === 'customer' ? 'No messages yet. Ask the team anything about this work.' : 'No messages yet.'}
        </p>
      ) : (
        <ol className="space-y-3">
          {messages.map((m, i) => {
            const mine = m.from === side;
            return (
              <li
                key={i}
                className={`max-w-[85%] rounded-[18px] border border-rule p-4 ${mine ? 'ml-auto bg-stone' : ''}`}
              >
                <p className="text-xs text-muted">
                  {mine ? 'You' : m.from === 'team' ? 'Pirento team' : order.email} · {formatDate(m.at)}
                </p>
                <p className="mt-1 whitespace-pre-line">{m.body}</p>
              </li>
            );
          })}
        </ol>
      )}
      {order.status !== 'cancelled' && (
        <form onSubmit={submit} className="mt-5 space-y-3">
          <label className="block">
            <span className="sr-only">Your message</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              maxLength={1000}
              placeholder={side === 'customer' ? 'Write to the team…' : 'Write to the customer…'}
              className="w-full rounded-[14px] border border-rule bg-paper px-4 py-3 outline-none focus:border-ink"
            />
          </label>
          <button
            disabled={busy || body.trim().length < 2}
            className="rounded-full bg-ink px-5 py-2.5 text-sm text-paper disabled:opacity-50"
          >
            {busy ? 'Sending…' : 'Send'}
          </button>
          {error && (
            <p role="alert" className="text-sm">
              ⚠ {error}
            </p>
          )}
        </form>
      )}
    </div>
  );
}

/** The customer's way to send. */
export const customerSend = (order, onDone) => async (body) =>
  onDone(await api(`/orders/${order._id}/messages`, {method: 'POST', body: {body}}));
