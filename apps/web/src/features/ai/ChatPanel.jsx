// The conversation itself: messages, thumbs up/down on each answer, and the box to write in.
import {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {Send, ThumbsDown, ThumbsUp} from 'lucide-react';
import {Button} from '../../components/ui/Button';
import {Tag} from '../../components/ui/Tag';
import {Reply} from './Reply';

export function ChatPanel({chat, off, examples = [], compact = false, onNavigate}) {
  const [input, setInput] = useState('');
  const end = useRef(null);
  useEffect(() => {
    end.current?.scrollIntoView({block: 'nearest'}); // braces: newer browsers return a Promise, which React would call as cleanup
  }, [chat.messages]);

  const submit = async (e) => {
    e?.preventDefault();
    const content = input.trim();
    if (!content) return;
    setInput('');
    if (!(await chat.send(content))) setInput(content);
  };

  return (
    <section aria-label="Conversation" className="flex min-h-0 min-w-0 flex-1 flex-col">
      <ol className={`flex-1 space-y-4 overflow-y-auto ${compact ? 'p-4' : 'p-6'}`} aria-live="polite">
        {off && (
          <li>
            <Tag>Expected</Tag>
            <p className="body mt-3">
              The assistant is not switched on yet. For help now, write to{' '}
              <Link className="text-ink underline" to="/support" onClick={onNavigate}>
                support
              </Link>
              .
            </p>
          </li>
        )}
        {!off && chat.messages.length === 0 && (
          <li className="space-y-2">
            <p className="text-sm text-muted">Try:</p>
            {examples.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setInput(q)}
                className="block w-full rounded-[14px] border border-rule px-4 py-2.5 text-left text-sm hover:border-ink"
              >
                {q}
              </button>
            ))}
          </li>
        )}
        {chat.messages.map((m, i) => (
          <li key={i} className={m.role === 'user' ? 'flex justify-end' : ''}>
            <div
              className={`max-w-[85%] rounded-[18px] px-5 py-3 whitespace-pre-wrap ${
                m.role === 'user' ? 'bg-ink text-paper' : 'border border-rule bg-stone'
              }`}
            >
              {m.role === 'assistant' ? (
                m.content ? (
                  <Reply text={m.content} onNavigate={onNavigate} />
                ) : (
                  <span className="text-muted">Thinking…</span>
                )
              ) : (
                m.content
              )}
            </div>
            {m.role === 'assistant' && m.content && !chat.busy && chat.chatId && (
              <div className="mt-1 flex gap-1 text-muted">
                {[
                  ['up', ThumbsUp, 'Helpful'],
                  ['down', ThumbsDown, 'Not helpful'],
                ].map(([r, Icon, label]) => (
                  <button
                    key={r}
                    type="button"
                    aria-label={label}
                    aria-pressed={chat.ratings[i] === r}
                    onClick={() => chat.rate(i, r)}
                    className={`rounded-full p-1.5 hover:text-ink ${chat.ratings[i] === r ? 'text-ink' : ''}`}
                  >
                    <Icon aria-hidden className="size-3.5" />
                  </button>
                ))}
              </div>
            )}
          </li>
        ))}
        <li ref={end} aria-hidden />
      </ol>
      {chat.error && (
        <p role="alert" className="px-6 pb-2 text-sm">
          ⚠ {chat.error}{' '}
          {/plans/.test(chat.error) && (
            <Link to="/ai/dashboard/plans" className="underline" onClick={onNavigate}>
              Plans
            </Link>
          )}
        </p>
      )}
      <form onSubmit={submit} className="flex items-end gap-3 border-t border-rule p-4">
        <label htmlFor={compact ? 'ask-ai-input' : 'ai-input'} className="sr-only">
          Message
        </label>
        <textarea
          id={compact ? 'ask-ai-input' : 'ai-input'}
          rows={2}
          maxLength={2000}
          value={input}
          disabled={off}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && submit(e)}
          placeholder="Ask in English or Hindi"
          className="min-w-0 flex-1 resize-none rounded-[14px] border border-rule bg-paper px-4 py-3 outline-none focus:border-ink"
        />
        <Button type="submit" variant="accent" icon={Send} disabled={chat.busy || off || !input.trim()}>
          Send
        </Button>
      </form>
    </section>
  );
}
