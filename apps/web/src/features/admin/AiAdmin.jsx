// Admin → Pirento AI: usage at a glance, the switch and free allowance and paid plans (superadmin), the knowledge
// base the assistant answers from, and answers people rated.
import {useState} from 'react';
import {PRODUCTS} from '@pirento/shared';
import {StatsRow} from '../../components/ui/Blocks';
import {Button} from '../../components/ui/Button';
import {Field} from '../../components/ui/Field';
import {Tag} from '../../components/ui/Tag';
import {TextArea} from '../../components/ui/TextArea';
import {api} from '../../lib/api/client';
import {useSession} from '../../lib/api/session';
import {useApi} from '../../lib/api/useApi';
import {formatDate, inr} from '../../lib/format';
import {selectCls} from '../learning/Pipeline';
import {AiTool} from '../ai/AiTool';

async function save(fn, setNote, done) {
  setNote('');
  try {
    await fn();
    setNote('Saved.');
    done?.();
  } catch (err) {
    setNote(`⚠ ${err.message}`);
  }
}

/** What people ask about, grouped by the AI, and where the assistant falls short. */
function Insights() {
  const [data, setData] = useState(null);
  const [note, setNote] = useState('');
  const load = async () => {
    setNote('Reading recent questions…');
    try {
      setData(await api('/ai/staff/ai/insights', {method: 'POST'}));
      setNote('');
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };
  return (
    <div className="space-y-4 rounded-[18px] border border-rule p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-medium">What people ask</p>
        <Button variant="outline" icon={null} onClick={load}>
          {data ? 'Refresh' : 'Summarise the last two weeks'}
        </Button>
      </div>
      {note && <p className="text-sm">{note}</p>}
      {data && (
        <div className="grid gap-6 lg:grid-cols-2">
          <ol className="space-y-2 text-sm">
            {data.themes.map((t) => (
              <li key={t.theme}>
                <span className="font-medium">{t.theme}</span> <span className="text-muted">· {t.count}</span>
                <span className="block text-muted">“{t.example}”</span>
              </li>
            ))}
          </ol>
          <div className="space-y-2 text-sm">
            <p className="eyebrow">Notes to write</p>
            {data.gaps.length === 0 && <p className="text-muted">No gaps found.</p>}
            {data.gaps.map((g) => (
              <p key={g.topic}>
                <span className="font-medium">{g.topic}:</span> {g.noteToWrite}
              </p>
            ))}
          </div>
        </div>
      )}
      <p className="text-xs text-muted">Made by the AI from questions without names, at most once an hour.</p>
    </div>
  );
}

function Overview({canEdit}) {
  const o = useApi('/ai/staff/ai/overview');
  const [form, setForm] = useState(null);
  const [note, setNote] = useState('');
  if (!o.data) return o.error ? <p className="body">⚠ {o.error.message}</p> : null;
  const f = form ?? {on: o.data.on, freeDailyLimit: o.data.freeDailyLimit, webSearch: o.data.webSearch};
  return (
    <div className="space-y-8">
      {!o.data.keySet && (
        <p className="rounded-[14px] border border-rule p-4 text-sm">
          ANTHROPIC_API_KEY is not set on the server, so the assistant cannot answer yet.
        </p>
      )}
      <StatsRow
        compact
        stats={[
          {label: 'Messages today', value: String(o.data.messagesToday)},
          {label: 'People today', value: String(o.data.peopleToday)},
          {label: 'Chats, 30 days', value: String(o.data.chats30)},
          {label: 'Helpful / not, 30 days', value: `${o.data.up30} / ${o.data.down30}`},
          {label: 'On a paid plan', value: String(o.data.subscribers)},
        ]}
      />
      {o.data.keySet && <Insights />}
      {canEdit && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save(() => api('/ai/staff/ai/settings', {method: 'PUT', body: f}), setNote, o.reload);
          }}
          className="flex max-w-2xl flex-wrap items-end gap-4 rounded-[18px] border border-rule p-5"
        >
          <label className="flex items-center gap-2 pb-3 text-sm">
            <input
              type="checkbox"
              className="size-4"
              checked={f.on}
              onChange={(e) => setForm({...f, on: e.target.checked})}
            />{' '}
            Assistant on
          </label>
          <label className="flex items-center gap-2 pb-3 text-sm">
            <input
              type="checkbox"
              className="size-4"
              checked={f.webSearch}
              onChange={(e) => setForm({...f, webSearch: e.target.checked})}
            />{' '}
            Web search for current facts
          </label>
          <Field
            label="Free messages a day"
            type="number"
            min={0}
            max={1000}
            value={f.freeDailyLimit}
            onChange={(e) => setForm({...f, freeDailyLimit: Number(e.target.value)})}
          />
          <Button type="submit" variant="outline" icon={null}>
            Save
          </Button>
          {note && <p className="w-full text-sm">{note}</p>}
        </form>
      )}
    </div>
  );
}

const NEW_PLAN = {name: '', price: '', dailyLimit: '', months: '1', active: true};

function PlanForm({initial, onSaved}) {
  const [p, setP] = useState(
    initial
      ? {
          ...initial,
          price: String(initial.price / 100),
          dailyLimit: String(initial.dailyLimit),
          months: String(initial.months),
        }
      : NEW_PLAN,
  );
  const [note, setNote] = useState('');
  const set = (k) => (e) =>
    setP((x) => ({...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value}));
  const body = {
    name: p.name,
    price: Math.round(Number(p.price) * 100),
    dailyLimit: Number(p.dailyLimit),
    months: Number(p.months),
    active: p.active,
  };
  const submit = (e) => {
    e.preventDefault();
    save(
      () =>
        api(initial ? `/ai/staff/ai/plans/${initial._id}` : '/ai/staff/ai/plans', {
          method: initial ? 'PATCH' : 'POST',
          body,
        }),
      setNote,
      () => {
        if (!initial) setP(NEW_PLAN);
        onSaved();
      },
    );
  };
  return (
    <form
      onSubmit={submit}
      className="grid items-end gap-3 rounded-[18px] border border-rule p-5 sm:grid-cols-2 xl:grid-cols-6"
    >
      <Field label="Name" required value={p.name} onChange={set('name')} />
      <Field label="Price (₹)" type="number" min={1} required value={p.price} onChange={set('price')} />
      <Field label="Messages a day" type="number" min={1} required value={p.dailyLimit} onChange={set('dailyLimit')} />
      <Field label="Months" type="number" min={1} max={24} required value={p.months} onChange={set('months')} />
      <label className="flex items-center gap-2 pb-3 text-sm">
        <input type="checkbox" className="size-4" checked={p.active} onChange={set('active')} /> On sale
      </label>
      <Button type="submit" variant="outline" icon={null}>
        {initial ? 'Save' : 'Add plan'}
      </Button>
      {note && <p className="text-sm sm:col-span-2 xl:col-span-6">{note}</p>}
    </form>
  );
}

function Plans({canEdit}) {
  const list = useApi('/ai/staff/ai/plans');
  return (
    <div className="space-y-4">
      {!canEdit && <p className="text-sm text-muted">Only a superadmin adds or changes plans.</p>}
      {canEdit && <PlanForm onSaved={list.reload} />}
      {list.data?.map((p) =>
        canEdit ? (
          <PlanForm key={p._id} initial={p} onSaved={list.reload} />
        ) : (
          <p key={p._id} className="border-b border-rule py-3 text-sm">
            {p.name} · {inr(p.price / 100)} · {p.dailyLimit} a day · {p.months} months {p.active ? '' : '· off sale'}
          </p>
        ),
      )}
      <p className="text-sm text-muted">A change applies to new purchases; what someone bought keeps its terms.</p>
    </div>
  );
}

const NEW_NOTE = {title: '', body: '', product: '', published: true};

function NoteForm({initial, onSaved}) {
  const [k, setK] = useState(initial ?? NEW_NOTE);
  const [note, setNote] = useState('');
  const set = (f) => (e) =>
    setK((x) => ({...x, [f]: e.target.type === 'checkbox' ? e.target.checked : e.target.value}));
  const submit = (e) => {
    e.preventDefault();
    const {title, body, product, published} = k;
    save(
      () =>
        api(initial ? `/ai/staff/ai/knowledge/${initial._id}` : '/ai/staff/ai/knowledge', {
          method: initial ? 'PUT' : 'POST',
          body: {title, body, product, published},
        }),
      setNote,
      () => {
        if (!initial) setK(NEW_NOTE);
        onSaved();
      },
    );
  };
  const remove = () =>
    confirm('Delete this note?') &&
    save(() => api(`/ai/staff/ai/knowledge/${initial._id}`, {method: 'DELETE'}), setNote, onSaved);
  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_14rem]">
        <Field label="Title" required value={k.title} onChange={set('title')} />
        <label className="grid gap-1 text-sm">
          For
          <select value={k.product} onChange={set('product')} className={selectCls}>
            <option value="">All of Pirento</option>
            {PRODUCTS.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <TextArea
        label="What the assistant should know"
        rows={6}
        maxLength={4000}
        value={k.body}
        onChange={set('body')}
      />
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4" checked={k.published} onChange={set('published')} /> In use
        </label>
        <Button type="submit" variant="outline" icon={null}>
          {initial ? 'Save note' : 'Add note'}
        </Button>
        {initial && (
          <Button type="button" variant="outline" icon={null} onClick={remove}>
            Delete
          </Button>
        )}
        {note && <p className="text-sm">{note}</p>}
      </div>
    </form>
  );
}

function Knowledge() {
  const list = useApi('/ai/staff/ai/knowledge');
  return (
    <div className="space-y-6">
      <p className="max-w-3xl text-sm text-muted">
        Notes in use are added to every chat: how a service works, timelines, policies, answers to common questions. The
        assistant prefers them over general knowledge. Keep them short and true.
      </p>
      <div className="rounded-[18px] border border-rule p-5">
        <NoteForm onSaved={list.reload} />
      </div>
      {list.data?.map((k) => (
        <details key={k._id} className="rounded-[18px] border border-rule px-5 py-4">
          <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
            <span className="min-w-0 font-medium">{k.title}</span>
            <span className="flex gap-2">
              {k.product && <Tag>{k.product}</Tag>}
              <Tag>{k.published ? 'In use' : 'Draft'}</Tag>
            </span>
          </summary>
          <div className="mt-4">
            <NoteForm initial={k} onSaved={list.reload} />
          </div>
        </details>
      ))}
    </div>
  );
}

function Feedback() {
  const [rating, setRating] = useState('down');
  const list = useApi(`/ai/staff/ai/feedback?rating=${rating}`);
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[
          ['down', 'Not helpful'],
          ['up', 'Helpful'],
        ].map(([r, label]) => (
          <Button key={r} variant={rating === r ? 'primary' : 'outline'} icon={null} onClick={() => setRating(r)}>
            {label}
          </Button>
        ))}
      </div>
      {list.data?.length === 0 && <p className="text-muted">Nothing rated yet.</p>}
      <ul className="border-t border-rule">
        {list.data?.map((f) => (
          <li key={f._id} className="space-y-2 border-b border-rule py-5 text-sm">
            <p className="text-muted">
              {formatDate(f.createdAt)}
              {f.product && ` · ${f.product}`}
            </p>
            <p className="font-medium whitespace-pre-wrap">{f.question}</p>
            <p className="whitespace-pre-wrap text-muted">{f.answer}</p>
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted">
        A wrong answer usually means a missing or unclear note: fix it under Knowledge.
      </p>
    </div>
  );
}

const TABS = {
  overview: 'Overview',
  ask: 'Ask',
  story: 'Foundation story',
  knowledge: 'Knowledge',
  feedback: 'Rated answers',
  plans: 'Plans',
};

export function AiAdmin() {
  const {user} = useSession();
  const canEdit = user?.role === 'superadmin';
  const [tab, setTab] = useState('overview');
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {Object.entries(TABS).map(([id, label]) => (
          <Button key={id} variant={tab === id ? 'primary' : 'outline'} icon={null} onClick={() => setTab(id)}>
            {label}
          </Button>
        ))}
      </div>
      {tab === 'overview' && <Overview canEdit={canEdit} />}
      {tab === 'ask' && (
        <div className="max-w-3xl">
          <AiTool id="adminAnswer" />
        </div>
      )}
      {tab === 'story' && (
        <div className="max-w-3xl">
          <AiTool id="impactStory" />
        </div>
      )}
      {tab === 'knowledge' && <Knowledge />}
      {tab === 'feedback' && <Feedback />}
      {tab === 'plans' && <Plans canEdit={canEdit} />}
    </div>
  );
}
