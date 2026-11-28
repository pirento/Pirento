// Admin → WhatsApp: the chats on Pirento's WhatsApp number. The bot (with Pirento AI) answers until a person asks
// for the team or a staff member takes the chat; then the team replies here, with a Pirento AI draft if they want,
// and can hand it back. Free text goes inside WhatsApp's 24-hour window; outside it the update template carries it.
// Settings: the bot and its AI on or off, the greeting, and the daily AI answers per number.
import {useEffect, useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {Bot, Send, Sparkles, UserRound} from 'lucide-react';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {StatusTag, Tag} from '../../components/ui/Tag';
import {TextArea} from '../../components/ui/TextArea';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {formatDate} from '../../lib/format';

const chip = (on) =>
  `rounded-full border px-4 py-2 text-sm ${on ? 'border-ink bg-ink text-paper' : 'border-rule hover:border-ink'}`;
const masked = (wa) => `+${wa.slice(0, 2)} ••••• ${wa.slice(-5)}`;

function Conversation({id, onChange}) {
  const one = useApi(`/support/staff/whatsapp/${id}`);
  const [text, setText] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    setText('');
    setMsg('');
  }, [id]);
  const d = one.data;
  if (!d) return <p className="text-sm text-muted">Loading…</p>;
  const c = d.chat;
  const run = async (fn) => {
    setMsg('');
    setBusy(true);
    try {
      await fn();
      one.reload();
      onChange();
    } catch (err) {
      setMsg(`⚠ ${err.message}`);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex min-h-[60dvh] flex-col rounded-[22px] border border-rule">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule p-4">
        <span className="min-w-0">
          <span className="block font-medium">{c.name || masked(c.wa)}</span>
          <span className="block text-xs text-muted">
            +{c.wa} · {c.email ?? 'not on an account'}
            {c.ticketNo && (
              <>
                {' · '}
                <Link to={`/support/${c.ticketId}`} className="underline underline-offset-4">
                  ticket #{c.ticketNo}
                </Link>
              </>
            )}
          </span>
        </span>
        <span className="flex flex-wrap items-center gap-2">
          <Tag tone="rule">{c.mode === 'staff' ? `With ${c.assignee?.email ?? 'the team'}` : 'Bot answers'}</Tag>
          {c.mode === 'staff' ? (
            <Button
              variant="outline"
              icon={Bot}
              onClick={() =>
                run(() => api(`/support/staff/whatsapp/${id}/mode`, {method: 'POST', body: {mode: 'bot'}}))
              }
            >
              Hand back to the bot
            </Button>
          ) : (
            <Button
              variant="outline"
              icon={UserRound}
              onClick={() =>
                run(() => api(`/support/staff/whatsapp/${id}/mode`, {method: 'POST', body: {mode: 'staff'}}))
              }
            >
              Take this chat
            </Button>
          )}
        </span>
      </div>
      <ol className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
        {d.messages.map((m) => (
          <li key={m._id} className={`flex ${m.dir === 'out' ? 'justify-end' : ''}`}>
            <div
              className={`max-w-[85%] rounded-[18px] px-4 py-2.5 text-sm ${m.dir === 'out' ? 'bg-ink text-paper' : 'bg-stone'}`}
            >
              <p className="whitespace-pre-line break-words">{m.text || '(not text)'}</p>
              <p className={`mt-1 text-[0.7rem] ${m.dir === 'out' ? 'opacity-70' : 'text-muted'}`}>
                {m.from === 'bot' ? 'Bot' : m.from === 'staff' ? m.by : 'Customer'} · {formatDate(m.createdAt)}
                {m.dir === 'out' && ` · ${m.status}`}
                {m.error && ` · ${m.error}`}
              </p>
            </div>
          </li>
        ))}
      </ol>
      <form
        noValidate
        className="space-y-3 border-t border-rule p-4"
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            await api(`/support/staff/whatsapp/${id}/reply`, {method: 'POST', body: {text}});
            setText('');
          });
        }}
      >
        <TextArea
          label="Reply on WhatsApp"
          rows={3}
          maxLength={4000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          required={false}
        />
        <p className="text-xs text-muted">
          {c.windowOpen
            ? 'They wrote in the last 24 hours: this goes as a normal message.'
            : 'Outside the 24-hour window: this goes inside the approved update template.'}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="primary" icon={Send} disabled={busy || !text.trim()}>
            Send
          </Button>
          <Button
            type="button"
            variant="outline"
            icon={Sparkles}
            disabled={busy}
            onClick={() =>
              run(async () => {
                const draft = await api(`/support/staff/whatsapp/${id}/draft`, {method: 'POST'});
                setText(draft.reply);
              })
            }
          >
            Draft with Pirento AI
          </Button>
          {msg && (
            <p role="status" className="text-sm">
              {msg}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}

function Inbox() {
  const [mode, setMode] = useState('');
  const [open, setOpen] = useState(null);
  const list = useApi(`/support/staff/whatsapp?mode=${mode}`);
  const d = list.data;
  return (
    <div className="space-y-6">
      {d && !d.on && (
        <p className="flex items-center gap-3 text-sm text-muted">
          <StatusTag status="expected" /> WhatsApp is not switched on yet (no Meta keys): chats and replies are kept but
          nothing is sent.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {[
          ['', 'All chats'],
          ['staff', `With the team ${d?.counts.staff ? `· ${d.counts.staff.unread} new` : ''}`],
          ['bot', 'Bot answers'],
        ].map(([v, l]) => (
          <button
            key={v || 'all'}
            type="button"
            aria-pressed={mode === v}
            onClick={() => setMode(v)}
            className={chip(mode === v)}
          >
            {l}
          </button>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <ul className="border-t border-rule lg:col-span-4">
          {d?.items.length === 0 && <p className="body mt-6">No chats yet.</p>}
          {d?.items.map((c) => (
            <li key={c._id}>
              <button
                type="button"
                onClick={() => setOpen(c._id)}
                aria-current={open === c._id}
                className={`flex w-full items-start gap-3 border-b border-rule px-2 py-3 text-left ${open === c._id ? 'bg-stone' : 'hover:bg-stone'}`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{c.name || masked(c.wa)}</span>
                  <span className="block truncate text-sm text-muted">{c.lastText}</span>
                </span>
                <span className="shrink-0 text-right text-xs text-muted">
                  {formatDate(c.lastAt)}
                  <span className="mt-1 block">
                    {c.mode === 'staff' ? 'Team' : 'Bot'}
                    {c.unread > 0 && (
                      <span className="ml-1 rounded-full bg-accent px-1.5 text-on-accent">{c.unread}</span>
                    )}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="lg:col-span-8">
          {open ? (
            <Conversation id={open} onChange={list.reload} />
          ) : (
            <p className="text-sm text-muted">Open a chat.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Settings() {
  const one = useApi('/support/staff/whatsapp-settings');
  const [f, setF] = useState(null);
  const [msg, setMsg] = useState('');
  useEffect(() => {
    if (one.data) setF(one.data);
  }, [one.data]);
  if (!f) return <p className="text-sm text-muted">Loading…</p>;
  const save = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const {bot, ai, greeting, dailyAi} = f;
      await api('/support/staff/whatsapp-settings', {
        method: 'PUT',
        body: {bot, ai, greeting, dailyAi: Number(dailyAi)},
      });
      setMsg('Saved.');
    } catch (err) {
      setMsg(`⚠ ${err.message}`);
    }
  };
  return (
    <form onSubmit={save} noValidate className="space-y-5 rounded-[22px] border border-rule p-6">
      {[
        ['bot', 'The bot answers', 'Menu, STOP/START and hand-overs. Off: every message waits for the team.'],
        [
          'ai',
          'Pirento AI answers questions',
          'With the person’s own account when the number is on one. Off: the menu only.',
        ],
      ].map(([k, label, note]) => (
        <label key={k} className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={f[k]}
            onChange={(e) => setF({...f, [k]: e.target.checked})}
            className="mt-1 size-4"
          />
          <span>
            <span className="block font-medium">{label}</span>
            <span className="block text-sm text-muted">{note}</span>
          </span>
        </label>
      ))}
      <TextArea
        label="Greeting (before the menu; empty uses “Namaste! This is Pirento on WhatsApp.”)"
        rows={2}
        maxLength={500}
        value={f.greeting}
        onChange={(e) => setF({...f, greeting: e.target.value})}
        required={false}
      />
      <div className="w-48">
        <Field
          label="AI answers per number a day"
          inputMode="numeric"
          value={String(f.dailyAi)}
          onChange={(e) => setF({...f, dailyAi: e.target.value.replace(/\D/g, '')})}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" icon={null}>
          Save
        </Button>
        {msg && (
          <p role="status" className="text-sm">
            {msg}
          </p>
        )}
      </div>
    </form>
  );
}

export function WhatsAppAdmin() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'settings' ? 'settings' : 'inbox';
  return (
    <div className="mt-8 space-y-8">
      <div className="flex gap-2" role="tablist">
        {[
          ['inbox', 'Chats'],
          ['settings', 'Settings'],
        ].map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setParams(id === 'settings' ? {tab: id} : {})}
            className={chip(tab === id)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'settings' ? <Settings /> : <Inbox />}
    </div>
  );
}
