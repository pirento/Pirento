// Admin → Notifications (superadmins): which channels each event goes on, a preview of how it reads on the dashboard,
// in email, SMS and WhatsApp, a test to yourself, which channels are set up, and the delivery log.
import {useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {Send} from 'lucide-react';
import {CHANNEL_NAMES, NOTICE_CHANNELS, getProduct} from '@pirento/shared';
import {Button} from '../../components/ui/Button';
import {Tag} from '../../components/ui/Tag';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {formatDate} from '../../lib/format';

// Events of the account centre and the team, which are not a product of their own.
const GROUP = {
  orders: 'Orders and payments',
  support: 'Support',
  wallet: 'Wallet',
  admin: 'The team',
  pirento: 'Other',
};
const groupName = (g) => GROUP[g] ?? getProduct(g)?.name ?? g;

const chip = (on) =>
  `rounded-full border px-4 py-2 text-sm ${on ? 'border-ink bg-ink text-paper' : 'border-rule hover:border-ink'}`;

function Preview({p}) {
  return (
    <div className="mt-4 grid gap-4 text-sm lg:grid-cols-2">
      <div className="rounded-[14px] border border-rule p-4">
        <p className="text-xs text-muted">Dashboard bell</p>
        <p className="mt-2 text-xs text-muted">{p.dashboard.brand}</p>
        <p className="font-medium">
          {p.dashboard.label}: {p.dashboard.big}
        </p>
        <p className="text-muted">{p.dashboard.note}</p>
      </div>
      <div className="rounded-[14px] border border-rule p-4">
        <p className="text-xs text-muted">Email</p>
        <p className="mt-2 font-medium">{p.email.subject}</p>
        {p.email.lines.map((l) => (
          <p key={l} className="break-words text-muted">
            {l}
          </p>
        ))}
      </div>
      <div className="rounded-[14px] border border-rule p-4">
        <p className="text-xs text-muted">SMS · {p.sms.length} characters</p>
        <p className="mt-2 font-mono text-xs break-words">{p.sms}</p>
      </div>
      <div className="rounded-[14px] border border-rule p-4">
        <p className="text-xs text-muted">WhatsApp · template values {'{{1}}–{{4}}'}</p>
        <p className="mt-2 break-words whitespace-pre-line">{p.whatsapp.text}</p>
      </div>
    </div>
  );
}

function EventRow({e, ready, onSaved}) {
  const [channels, setChannels] = useState(e.channels);
  const [msg, setMsg] = useState('');
  const save = async (next) => {
    setChannels(next);
    setMsg('');
    try {
      await api(`/auth/staff/notices/${e.id}`, {method: 'PUT', body: {channels: next}});
      onSaved();
    } catch (err) {
      setMsg(`⚠ ${err.message}`);
    }
  };
  const test = async () => {
    setMsg('');
    try {
      const {route} = await api(`/auth/staff/notices/${e.id}/test`, {method: 'POST'});
      setMsg(
        `Sent to you: ${NOTICE_CHANNELS.map((c) => `${CHANNEL_NAMES[c]} ${route[c] === true ? '✓' : `(${route[c]})`}`).join(' · ')}`,
      );
    } catch (err) {
      setMsg(`⚠ ${err.message}`);
    }
  };
  return (
    <details className="border-b border-rule">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block font-medium">
            {e.title} {e.important && <Tag tone="rule">Important</Tag>} {e.staff && <Tag tone="rule">Staff</Tag>}
          </span>
          <span className="block font-mono text-xs text-muted">{e.id}</span>
        </span>
        <span className="flex flex-wrap gap-3 text-sm" onClick={(x) => x.stopPropagation()}>
          {NOTICE_CHANNELS.map((c) => (
            <label key={c} className={`flex items-center gap-1.5 ${ready[c] ? '' : 'text-muted'}`}>
              <input
                type="checkbox"
                className="size-4"
                checked={Boolean(channels[c])}
                onChange={(x) => save({...channels, [c]: x.target.checked})}
              />
              {CHANNEL_NAMES[c]}
            </label>
          ))}
        </span>
      </summary>
      <div className="pb-6">
        <Preview p={e.preview} />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="outline" icon={Send} onClick={test}>
            Send me a test
          </Button>
          {msg && (
            <p role="status" className="text-sm">
              {msg}
            </p>
          )}
        </div>
      </div>
    </details>
  );
}

function Events() {
  const one = useApi('/auth/staff/notices');
  const d = one.data;
  if (!d) return <p className="text-sm text-muted">Loading…</p>;
  const groups = [...new Set(d.events.map((e) => e.product))];
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2 text-sm">
        {NOTICE_CHANNELS.map((c) => (
          <Tag key={c} tone={d.ready[c] ? 'rule' : 'accent'}>
            {CHANNEL_NAMES[c]}: {d.ready[c] ? 'set up' : 'not set up'}
          </Tag>
        ))}
      </div>
      <p className="text-sm text-muted">
        WhatsApp notices go from +{d.whatsapp.number} with the approved template “{d.whatsapp.template}” (four values:
        product, subject, what happened, details and link), to people who said yes. Important notices ignore a person’s
        email and SMS switches.
      </p>
      {groups.map((g) => (
        <div key={g}>
          <p className="text-xs tracking-[0.12em] text-muted uppercase">{groupName(g)}</p>
          <div className="mt-2 border-t border-rule">
            {d.events
              .filter((e) => e.product === g)
              .map((e) => (
                <EventRow key={e.id} e={e} ready={d.ready} onSaved={one.reload} />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Log() {
  const [channel, setChannel] = useState('');
  const [status, setStatus] = useState('');
  const log = useApi(`/auth/staff/notices/log?channel=${channel}&status=${status}`);
  const d = log.data;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {['', ...NOTICE_CHANNELS].map((c) => (
          <button
            key={c || 'all'}
            type="button"
            aria-pressed={channel === c}
            onClick={() => setChannel(c)}
            className={chip(channel === c)}
          >
            {c ? CHANNEL_NAMES[c] : 'All channels'}
          </button>
        ))}
        {['', 'sent', 'skipped', 'failed'].map((s) => (
          <button
            key={s || 'any'}
            type="button"
            aria-pressed={status === s}
            onClick={() => setStatus(s)}
            className={chip(status === s)}
          >
            {s || 'Any status'}
          </button>
        ))}
      </div>
      {d && (
        <p className="text-sm text-muted">
          Last 7 days:{' '}
          {NOTICE_CHANNELS.map((c) => {
            const sent = d.week.find((w) => w.channel === c && w.status === 'sent')?.n ?? 0;
            const failed = d.week.find((w) => w.channel === c && w.status === 'failed')?.n ?? 0;
            return `${CHANNEL_NAMES[c]} ${sent} sent${failed ? `, ${failed} failed` : ''}`;
          }).join(' · ')}
        </p>
      )}
      <ul className="border-t border-rule text-sm">
        {d?.items.map((r) => (
          <li key={r._id} className="flex flex-wrap items-center gap-3 border-b border-rule py-3">
            <span className="w-36 shrink-0 text-muted">{formatDate(r.createdAt)}</span>
            <span className="w-24 shrink-0">{CHANNEL_NAMES[r.channel]}</span>
            <span className="font-mono text-xs">{r.event}</span>
            <Tag tone={r.status === 'failed' ? 'accent' : 'rule'}>{r.status}</Tag>
            {r.reason && <span className="text-muted">{r.reason}</span>}
          </li>
        ))}
      </ul>
      {d?.items.length === 0 && <p className="body">Nothing here.</p>}
    </div>
  );
}

export function NoticesAdmin() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'log' ? 'log' : 'events';
  return (
    <div className="mt-8 space-y-8">
      <div className="flex gap-2" role="tablist">
        {[
          ['events', 'Notifications'],
          ['log', 'Delivery log'],
        ].map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setParams(id === 'log' ? {tab: id} : {})}
            className={chip(tab === id)}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'log' ? <Log /> : <Events />}
    </div>
  );
}
