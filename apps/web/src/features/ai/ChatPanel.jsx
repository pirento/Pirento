// The conversation itself: messages, thumbs up/down and read-aloud on each answer, and the box to write in, speak
// into, or attach a PDF or photo to.
import {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {Mic, MicOff, Paperclip, Send, ThumbsDown, ThumbsUp, Volume2, X} from 'lucide-react';
import {Button} from '../../components/ui/Button';
import {Tag} from '../../components/ui/Tag';
import {Reply} from './Reply';

const MAX_FILE = 5 * 1024 * 1024;
const Recognition = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

/** Reads an answer aloud, in Hindi when it is written in Devanagari. */
function speak(text) {
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/\[Attached:[^\]]*\]/g, ''));
  u.lang = /[\u0900-\u097F]/.test(text) ? 'hi-IN' : 'en-IN';
  speechSynthesis.speak(u);
}

/** A chosen file as {name, type, data} with base64 data, or an error message. */
const readFile = (f) =>
  new Promise((resolve) => {
    if (f.size > MAX_FILE) return resolve({error: 'Attach a file up to 5 MB'});
    if (!/^(application\/pdf|image\/(png|jpeg|webp|gif))$/.test(f.type)) {
      return resolve({error: 'Attach a PDF or a photo (PNG, JPG, WebP)'});
    }
    const r = new FileReader();
    r.onload = () => resolve({file: {name: f.name, type: f.type, data: String(r.result).split(',')[1]}});
    r.onerror = () => resolve({error: 'Could not read that file'});
    r.readAsDataURL(f);
  });

export function ChatPanel({chat, off, examples = [], compact = false, onNavigate}) {
  const [input, setInput] = useState('');
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [listening, setListening] = useState(false);
  const recog = useRef(null);
  const end = useRef(null);
  useEffect(() => {
    return () => {
      recog.current?.abort();
    };
  }, []);

  const pick = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const r = await readFile(f);
    setFileError(r.error ?? '');
    setFile(r.file ?? null);
  };

  /** Speech to text in the browser (Hindi and English); the words land in the box to check before sending. */
  const listen = () => {
    if (listening) {
      recog.current?.stop();
      return;
    }
    const r = new Recognition();
    r.lang = 'hi-IN'; // understands Hinglish and English words too
    r.interimResults = true;
    const before = input ? `${input} ` : '';
    r.onresult = (ev) => setInput(before + [...ev.results].map((x) => x[0].transcript).join(''));
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    recog.current = r;
    setListening(true);
    r.start();
  };
  useEffect(() => {
    end.current?.scrollIntoView({block: 'nearest'}); // braces: newer browsers return a Promise, which React would call as cleanup
  }, [chat.messages]);

  const submit = async (e) => {
    e?.preventDefault();
    const content = input.trim();
    if (!content) return;
    setInput('');
    const sending = file;
    setFile(null);
    if (!(await chat.send(content, sending))) {
      setInput(content);
      setFile(sending);
    }
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
                {'speechSynthesis' in window && (
                  <button
                    type="button"
                    aria-label="Read aloud"
                    onClick={() => speak(m.content)}
                    className="rounded-full p-1.5 hover:text-ink"
                  >
                    <Volume2 aria-hidden className="size-3.5" />
                  </button>
                )}
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
      {(file || fileError) && (
        <p className="flex items-center gap-2 px-4 pt-3 text-sm">
          {file ? (
            <>
              <Paperclip aria-hidden className="size-4" />
              <span className="min-w-0 truncate">{file.name}</span>
              <button
                type="button"
                aria-label="Remove the file"
                onClick={() => setFile(null)}
                className="rounded-full p-1"
              >
                <X aria-hidden className="size-3.5" />
              </button>
            </>
          ) : (
            <span role="alert">⚠ {fileError}</span>
          )}
        </p>
      )}
      <form onSubmit={submit} className="flex items-end gap-2 border-t border-rule p-4">
        <div className="flex flex-col gap-1">
          <label
            className={`flex size-10 cursor-pointer items-center justify-center rounded-full border border-rule hover:border-ink has-focus-visible:outline-2 ${off ? 'pointer-events-none opacity-50' : ''}`}
            title="Attach a PDF or photo"
          >
            <Paperclip aria-hidden className="size-4" />
            <span className="sr-only">Attach a PDF or photo</span>
            <input
              type="file"
              accept="application/pdf,image/png,image/jpeg,image/webp,image/gif"
              className="sr-only"
              onChange={pick}
              disabled={off}
            />
          </label>
          {Recognition && (
            <button
              type="button"
              onClick={listen}
              disabled={off}
              aria-pressed={listening}
              aria-label={listening ? 'Stop listening' : 'Speak your question'}
              className={`flex size-10 items-center justify-center rounded-full border ${listening ? 'border-accent bg-accent text-on-accent' : 'border-rule hover:border-ink'} disabled:opacity-50`}
            >
              {listening ? <MicOff aria-hidden className="size-4" /> : <Mic aria-hidden className="size-4" />}
            </button>
          )}
        </div>
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
