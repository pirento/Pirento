// /notifications: where Pirento reaches this person (dashboard, email, SMS, WhatsApp), products to keep quiet, and
// everything sent to them, with a link to what each notice is about.
import {useEffect, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {Bell} from 'lucide-react';
import {PRODUCTS} from '@pirento/shared';
import {PageHero} from '../../components/PageHero';
import {Button} from '../../components/ui/Button';
import {Label} from '../../components/ui/Heading';
import {noticesCopy as copy} from '../../data/site';
import {useSignedIn} from '../auth/useSignedIn';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {formatDate} from '../../lib/format';
import {usePageMeta} from '../../lib/page';
import {usePageMotion} from '../../lib/motion';

const MUTABLE = PRODUCTS.map((p) => ({slug: p.slug, name: p.name}));

function Choices() {
  const prefs = useApi('/auth/me/notice-prefs');
  const [f, setF] = useState(null);
  const [msg, setMsg] = useState('');
  useEffect(() => {
    if (prefs.data) setF(prefs.data);
  }, [prefs.data]);
  if (!f) return null;
  const save = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      const {email, sms, whatsapp, muted} = f;
      await api('/auth/me/notice-prefs', {method: 'PUT', body: {email, sms, whatsapp, muted}});
      setMsg(copy.saved);
    } catch (err) {
      setMsg(`⚠ ${err.message}`);
    }
  };
  const toggleMute = (slug) =>
    setF({...f, muted: f.muted.includes(slug) ? f.muted.filter((x) => x !== slug) : [...f.muted, slug]});
  return (
    <form onSubmit={save} noValidate className="rounded-[22px] border border-rule p-6 md:p-8" data-reveal>
      <Label n={1}>Channels</Label>
      <ul className="mt-6 divide-y divide-rule border-y border-rule">
        {Object.entries(copy.channels).map(([id, [name, note]]) => {
          const needsPhone = (id === 'sms' || id === 'whatsapp') && !f.phone;
          return (
            <li key={id} className="flex items-start justify-between gap-4 py-4">
              <span className="min-w-0">
                <span className="block font-medium">{name}</span>
                <span className="block text-sm text-muted">{needsPhone ? copy.noMobile : note}</span>
              </span>
              <input
                type="checkbox"
                className="mt-1 size-5 shrink-0"
                aria-label={name}
                checked={id === 'dashboard' ? true : Boolean(f[id])}
                disabled={id === 'dashboard' || needsPhone}
                onChange={(e) => setF({...f, [id]: e.target.checked})}
              />
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-sm text-muted">{copy.important}</p>
      <p className="mt-8 font-medium">{copy.products}</p>
      <p className="mt-1 text-sm text-muted">{copy.productsNote}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {MUTABLE.map((p) => (
          <button
            key={p.slug}
            type="button"
            aria-pressed={f.muted.includes(p.slug)}
            onClick={() => toggleMute(p.slug)}
            className={`rounded-full border px-4 py-2 text-sm ${f.muted.includes(p.slug) ? 'border-ink bg-ink text-paper' : 'border-rule hover:border-ink'}`}
          >
            {p.name}
          </button>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" icon={null}>
          {copy.save}
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

function History() {
  const [before, setBefore] = useState('');
  const [items, setItems] = useState([]);
  const page = useApi(`/auth/me/notices${before ? `?before=${before}` : ''}`);
  useEffect(() => {
    if (page.data) setItems((x) => (before ? [...x, ...page.data.items] : page.data.items));
  }, [page.data]); // a new page appends; the first replaces
  useEffect(() => {
    if (!before && page.data?.unread) api('/auth/me/notices/read', {method: 'POST'}).catch(() => {});
  }, [page.data, before]);
  return (
    <div className="rounded-[22px] border border-rule p-6 md:p-8" data-reveal>
      <Label n={2}>{copy.history}</Label>
      {page.data && items.length === 0 && <p className="body mt-6">{copy.empty}</p>}
      <ul className="mt-4">
        {items.map((n) => {
          const body = (
            <>
              <span className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full border border-rule">
                <Bell aria-hidden className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-muted">
                  {n.brand} · {formatDate(n.createdAt)}
                </span>
                <span className="block font-medium">
                  {n.label}: {n.big}
                </span>
                <span className="block text-sm break-words text-muted">{n.note}</span>
              </span>
            </>
          );
          return (
            <li key={n._id} className="border-b border-rule">
              {n.link && n.link.startsWith('/') ? (
                <Link to={n.link} className="flex gap-4 py-4 hover:underline">
                  {body}
                </Link>
              ) : (
                <div className="flex gap-4 py-4">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
      {page.data?.items.length === 50 && (
        <button
          type="button"
          onClick={() => setBefore(items.at(-1)._id)}
          className="mt-4 text-sm underline underline-offset-4"
        >
          {copy.more}
        </button>
      )}
    </div>
  );
}

export function Notifications() {
  const {redirect, user} = useSignedIn();
  const ref = useRef(null);
  usePageMotion(ref, [Boolean(user)]);
  usePageMeta({title: `${copy.title} — Pirento`});
  if (redirect) return redirect;
  if (!user) return <div className="min-h-dvh" />;
  return (
    <div ref={ref} className="space-y-10">
      <PageHero label="Pirento Ecosystem · Account" title={copy.title} intro={copy.intro} />
      <Choices />
      <History />
    </div>
  );
}
