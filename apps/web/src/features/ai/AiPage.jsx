// Pirento AI dashboard: saved chats and a streaming conversation that can read your own account across Pirento,
// and the plans for more messages a day.
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {MessageSquarePlus, Trash2} from 'lucide-react';
import {StatsRow} from '../../components/ui/Blocks';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {DashSection} from '../../components/ui/DashSection';
import {Tag} from '../../components/ui/Tag';
import {appDashboards} from '../../data/site';
import {useSignedIn} from '../auth/useSignedIn';
import {AppFrame} from '../products/AppFrame';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {formatDay, inr} from '../../lib/format';
import {usePageMeta} from '../../lib/page';
import {ChatPanel} from './ChatPanel';
import {useChat} from './useChat';

const copy = appDashboards.ai;

function Memory() {
  const mem = useApi('/ai/memory');
  const [draft, setDraft] = useState(null);
  const [line, setLine] = useState('');
  const [note, setNote] = useState('');
  if (!mem.data) return mem.error ? <p className="body">⚠ {mem.error.message}</p> : null;
  const m = draft ?? mem.data;
  const save = async (next) => {
    setNote('');
    try {
      const saved = await api('/ai/memory', {method: 'PUT', body: next});
      setDraft(saved);
      setNote('Saved.');
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };
  const add = (e) => {
    e.preventDefault();
    if (!line.trim()) return;
    save({...m, notes: [...m.notes, line.trim()]});
    setLine('');
  };
  return (
    <div className="max-w-2xl space-y-6">
      <p className="body">{copy.memory.intro}</p>
      <label className="flex items-center gap-3 text-sm">
        <input type="checkbox" className="size-4" checked={m.on} onChange={(e) => save({...m, on: e.target.checked})} />
        Use my notes in every chat
      </label>
      <ul className="border-t border-rule">
        {m.notes.map((n, i) => (
          <li key={i} className="flex items-center justify-between gap-3 border-b border-rule py-3">
            <span className="min-w-0 break-words">{n}</span>
            <button
              type="button"
              aria-label={`Delete: ${n}`}
              onClick={() => save({...m, notes: m.notes.filter((_, j) => j !== i)})}
              className="rounded-full p-2 hover:bg-stone"
            >
              <Trash2 aria-hidden className="size-4" />
            </button>
          </li>
        ))}
      </ul>
      {m.notes.length < 10 && (
        <form onSubmit={add} className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 grow">
            <Field
              label="Add a note (up to 200 characters)"
              maxLength={200}
              placeholder={copy.memory.placeholder}
              value={line}
              onChange={(e) => setLine(e.target.value)}
            />
          </div>
          <Button type="submit" variant="outline" icon={null}>
            Add
          </Button>
        </form>
      )}
      {note && <p className="text-sm">{note}</p>}
    </div>
  );
}

function Plans({usage}) {
  const plans = useApi('/ai/plans');
  const [note, setNote] = useState('');
  const buy = async (p) => {
    if (!confirm(`Pay ${inr(p.price / 100)} from your wallet for ${p.name}?`)) return;
    setNote('');
    try {
      await api(`/ai/plans/${p._id}/buy`, {method: 'POST'});
      setNote(`${p.name} is on.`);
      usage.reload();
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };
  const current = usage.data?.plan;
  const renew = async (on) => {
    setNote('');
    try {
      await api('/ai/plans/auto-renew', {method: 'PUT', body: {on}});
      usage.reload();
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };
  return (
    <>
      <DashSection n={1} id="now" label={copy.plans.label} title={copy.plans.title}>
        <StatsRow
          compact
          stats={[
            {label: 'Your plan', value: current?.name ?? 'Free'},
            {label: 'Messages a day', value: usage.data ? String(usage.data.limit) : '—'},
            {label: 'Used today', value: usage.data ? String(usage.data.used) : '—'},
            {label: 'Plan ends', value: current ? formatDay(current.until) : '—'},
          ]}
        />
        {current && (
          <label className="mt-6 flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              className="size-4"
              checked={current.autoRenew}
              onChange={(e) => renew(e.target.checked)}
            />
            Renew {current.name} from my wallet when it ends (you get an email each time; switch off any time)
          </label>
        )}
      </DashSection>
      <DashSection n={2} id="plans" label="Plans" title="More messages, / paid from your wallet.">
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <li className="flex flex-col rounded-[22px] border border-rule p-6" data-reveal>
            <p className="eyebrow">Free</p>
            <p className="mt-4 text-3xl">{plans.data?.free ?? '—'}</p>
            <p className="text-sm text-muted">messages a day, for everyone</p>
          </li>
          {plans.data?.plans.map((p) => (
            <li key={p._id} className="flex flex-col rounded-[22px] border border-rule p-6" data-reveal>
              <p className="eyebrow">{p.name}</p>
              <p className="mt-4 text-3xl">{p.dailyLimit}</p>
              <p className="text-sm text-muted">
                messages a day for {p.months} month{p.months === 1 ? '' : 's'}
              </p>
              <p className="mt-4 text-lg">{inr(p.price / 100)}</p>
              <Button className="mt-6 self-start" variant="outline" onClick={() => buy(p)}>
                {current?.name === p.name ? 'Add more months' : 'Buy from wallet'}
              </Button>
            </li>
          ))}
        </ul>
        {plans.data?.plans.length === 0 && <p className="mt-4 text-sm text-muted">{copy.plans.none}</p>}
        {note && (
          <p role="status" className="mt-4 text-sm">
            {note}{' '}
            {/balance/i.test(note) && (
              <Link to="/ai/dashboard/wallet" className="underline">
                Add money
              </Link>
            )}
          </p>
        )}
        <p className="mt-4 text-sm text-muted">{copy.plans.note}</p>
      </DashSection>
    </>
  );
}

export function Ai({product, section}) {
  const {redirect, user} = useSignedIn();
  const status = useApi(user ? '/ai/status' : null);
  const chats = useApi(user ? '/ai/chats' : null);
  const usage = useApi(user ? '/ai/usage' : null);
  const chat = useChat({
    onSent: () => {
      chats.reload();
      usage.reload();
    },
  });
  usePageMeta({title: 'Pirento AI', description: 'Ask about Pirento, or about your own account.'});
  if (redirect) return redirect;

  if (section === 'memory') {
    return (
      <AppFrame product={product} section={section} title={copy.memory.page}>
        <Memory />
      </AppFrame>
    );
  }

  if (section === 'plans') {
    return (
      <AppFrame product={product} section={section} title={copy.plans.page}>
        <Plans usage={usage} />
      </AppFrame>
    );
  }

  const remove = async (id) => {
    if (!confirm('Delete this chat?')) return;
    try {
      await api(`/ai/chats/${id}`, {method: 'DELETE'});
      if (id === chat.chatId) chat.open(null);
      chats.reload();
    } catch (err) {
      alert(err.message);
    }
  };
  const off = status.data && !status.data.enabled;

  return (
    <AppFrame product={product} section={section} title={copy.hello} intro={copy.intro} ready={Boolean(status.data)}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <aside className="min-w-0 lg:col-span-3">
          <Button
            onClick={() => chat.open(null)}
            variant="outline"
            icon={MessageSquarePlus}
            className="w-full justify-center"
          >
            New chat
          </Button>
          {usage.data && (
            <p className="mt-3 text-center text-xs text-muted tabular-nums" aria-live="polite">
              {Math.max(0, usage.data.limit - usage.data.used)} of {usage.data.limit} messages left today
              {usage.data.plan ? ` · ${usage.data.plan.name}` : ''}
            </p>
          )}
          <ul className="mt-4">
            {chats.data?.map((c) => (
              <li key={c._id} className="flex items-center gap-1 border-b border-rule">
                <button
                  onClick={() => chat.open(c._id)}
                  aria-current={c._id === chat.chatId ? 'true' : undefined}
                  className={`min-w-0 flex-1 truncate py-3 text-left text-sm ${c._id === chat.chatId ? 'font-medium text-ink' : 'text-muted hover:text-ink'}`}
                >
                  {c.title}
                </button>
                {c.product && <Tag>{c.product}</Tag>}
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
        <div className="flex min-h-[32rem] min-w-0 flex-col rounded-[22px] border border-rule lg:col-span-9">
          <ChatPanel chat={chat} off={off} examples={copy.examples} />
        </div>
      </div>
    </AppFrame>
  );
}
