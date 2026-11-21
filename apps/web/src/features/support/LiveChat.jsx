// Live chat: one running conversation with the team, kept as a support request so nothing is lost.
// It checks for new replies every 15 seconds while open.
import {useEffect, useState} from 'react';
import {support as copy} from '../../data/site';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {formatDate} from '../../lib/format';

export function LiveChat({tickets, product, onStarted}) {
  const running = tickets?.find((t) => t.subject.startsWith(copy.chat.subject) && t.status !== 'closed');
  const chat = useApi(running ? `/support/${running._id}` : null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const {reload} = chat;
  useEffect(() => {
    if (!running) return undefined;
    const timer = setInterval(reload, 15_000);
    return () => {
      clearInterval(timer);
    };
  }, [running, reload]);

  const send = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (running) {
        await api(`/support/${running._id}/messages`, {method: 'POST', body: {body: text.trim()}});
        chat.reload();
      } else {
        const date = new Date().toLocaleDateString('en-IN', {day: 'numeric', month: 'short'});
        await api('/support', {
          method: 'POST',
          body: {subject: `${copy.chat.subject} · ${date}`, message: text.trim(), ...(product ? {product} : {})},
        });
        onStarted();
      }
      setText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const messages = chat.data?.messages ?? [];
  return (
    <div>
      {running ? (
        <ol className="space-y-3" aria-live="polite">
          {messages.map((m, i) => (
            <li
              key={i}
              className={`max-w-[85%] rounded-[18px] border border-rule p-4 ${m.from === 'customer' ? 'ml-auto bg-stone' : ''}`}
            >
              <p className="text-xs text-muted">
                {m.from === 'customer' ? 'You' : 'Pirento team'} · {formatDate(m.at)}
              </p>
              <p className="mt-1 whitespace-pre-line">{m.body}</p>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-muted">{copy.chat.intro}</p>
      )}
      <form onSubmit={send} className="mt-6 flex flex-col gap-3 sm:flex-row">
        <label className="flex-1">
          <span className="sr-only">Your message</span>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={4000}
            placeholder={running ? 'Type your message…' : 'What can we help with?'}
            className="block w-full rounded-full border border-rule bg-paper px-5 py-3 outline-none focus:border-ink"
          />
        </label>
        <button
          disabled={busy || text.trim().length < 2}
          className="rounded-full bg-ink px-6 py-3 text-sm text-paper disabled:opacity-50"
        >
          {running ? 'Send' : copy.chat.start}
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-3 text-sm">
          ⚠ {error}
        </p>
      )}
    </div>
  );
}
