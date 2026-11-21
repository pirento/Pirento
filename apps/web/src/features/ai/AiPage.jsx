// Pirento AI dashboard: saved chats and a streaming conversation.
import {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {MessageSquarePlus, Send, Trash2} from 'lucide-react';
import {PageHero} from '../../components/PageHero';
import {Button} from '../../components/ui/Button';
import {Tag} from '../../components/ui/Tag';
import {Reply} from './Reply';
import {useSignedIn} from '../auth/useSignedIn';
import {api, authFetch} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {usePageMeta} from '../../lib/page';

export function Ai() {
  const {redirect, user} = useSignedIn();
  const status = useApi(user ? '/ai/status' : null);
  const chats = useApi(user ? '/ai/chats' : null);
  const usage = useApi(user ? '/ai/usage' : null);
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const end = useRef(null);
  usePageMeta({title: 'Pirento AI', description: 'Ask which Pirento service fits your need.'});
  useEffect(() => {
    end.current?.scrollIntoView({block: 'nearest'}); // braces: newer browsers return a Promise, which React would call as cleanup
  }, [messages]);
  if (redirect) return redirect;

  const open = async (id) => {
    setError('');
    setChatId(id);
    try {
      setMessages(id ? (await api(`/ai/chats/${id}`)).messages : []);
    } catch (err) {
      setError(err.message);
    }
  };
  const remove = async (id) => {
    if (!confirm('Delete this chat?')) return;
    try {
      await api(`/ai/chats/${id}`, {method: 'DELETE'});
      if (id === chatId) open(null);
      chats.reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const send = async (e) => {
    e.preventDefault();
    const content = input.trim();
    if (!content || busy) return;
    setInput('');
    setError('');
    setBusy(true);
    setMessages((m) => [...m, {role: 'user', content}, {role: 'assistant', content: ''}]);
    try {
      const res = await authFetch(`/api/ai/chats/${chatId ?? 'new'}/messages`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({content}),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error?.message ?? 'Something went wrong');
      if (!chatId) setChatId(res.headers.get('x-chat-id'));
      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      for (;;) {
        const {value, done} = await reader.read();
        if (done) break;
        setMessages((m) => [...m.slice(0, -1), {role: 'assistant', content: m.at(-1).content + value}]);
      }
      chats.reload();
      usage.reload();
    } catch (err) {
      setError(err.message);
      setMessages((m) => m.slice(0, -2));
      setInput(content);
    } finally {
      setBusy(false);
    }
  };

  const off = status.data && !status.data.enabled;

  return (
    <div>
      <PageHero
        label="Pirento AI · Dashboard"
        title="Ask what you / need done."
        intro="The assistant knows Pirento's services and prices. It gives general information, not legal or tax advice."
      />
      <div className="container-x grid grid-cols-1 gap-6 pb-28 lg:grid-cols-12">
        <aside className="min-w-0 lg:col-span-3">
          <Button
            onClick={() => open(null)}
            variant="outline"
            icon={MessageSquarePlus}
            className="w-full justify-center"
          >
            New chat
          </Button>
          {usage.data && (
            <p className="mt-3 text-center text-xs text-muted tabular-nums" aria-live="polite">
              {Math.max(0, usage.data.limit - usage.data.used)} of {usage.data.limit} messages left today
            </p>
          )}
          <ul className="mt-4">
            {chats.data?.map((c) => (
              <li key={c._id} className="flex items-center gap-1 border-b border-rule">
                <button
                  onClick={() => open(c._id)}
                  aria-current={c._id === chatId ? 'true' : undefined}
                  className={`min-w-0 flex-1 truncate py-3 text-left text-sm ${c._id === chatId ? 'font-medium text-ink' : 'text-muted hover:text-ink'}`}
                >
                  {c.title}
                </button>
                <button
                  onClick={() => remove(c._id)}
                  className="rounded-full p-2 hover:bg-stone"
                  aria-label={`Delete chat ${c.title}`}
                >
                  <Trash2 aria-hidden className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <section
          aria-label="Conversation"
          className="flex min-h-[28rem] min-w-0 flex-col rounded-[22px] border border-rule lg:col-span-9"
        >
          <ol className="flex-1 space-y-4 p-6" aria-live="polite">
            {off && (
              <li>
                <Tag>Expected</Tag>
                <p className="body mt-3">
                  The assistant is not switched on yet. For help now, write to{' '}
                  <Link className="text-ink underline" to="/support">
                    support
                  </Link>
                  .
                </p>
              </li>
            )}
            {!off && messages.length === 0 && (
              <li className="body">Try: “I want to start a company with two friends. What do I need?”</li>
            )}
            {messages.map((m, i) => (
              <li
                key={i}
                className={`max-w-[85%] rounded-[18px] px-5 py-3 whitespace-pre-wrap ${
                  m.role === 'user' ? 'ml-auto bg-ink text-paper' : 'border border-rule bg-stone'
                }`}
              >
                {m.role === 'assistant' ? (
                  m.content ? (
                    <Reply text={m.content} />
                  ) : (
                    <span className="text-muted">Thinking…</span>
                  )
                ) : (
                  m.content
                )}
              </li>
            ))}
            <li ref={end} aria-hidden />
          </ol>
          {error && (
            <p role="alert" className="px-6 pb-2 text-sm">
              ⚠ {error}
            </p>
          )}
          <form onSubmit={send} className="flex items-end gap-3 border-t border-rule p-4">
            <label htmlFor="ai-input" className="sr-only">
              Message
            </label>
            <textarea
              id="ai-input"
              rows={2}
              maxLength={2000}
              value={input}
              disabled={off}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send(e)}
              placeholder="Ask in English or Hindi"
              className="min-w-0 flex-1 resize-none rounded-[14px] border border-rule bg-paper px-4 py-3 outline-none focus:border-ink"
            />
            <Button type="submit" variant="accent" icon={Send} disabled={busy || off || !input.trim()}>
              Send
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
