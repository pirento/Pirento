// /support: the one support desk for every product, the account and the wallet, in four ways to reach us
// (tickets, live chat, email, callback). Opened from a product (?product=legal&order=100031), it already knows
// where you came from and wears that product's colours.
import {useRef, useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import {getProduct} from '@pirento/shared';
import {DashSection} from '../../components/ui/DashSection';
import {Heading} from '../../components/ui/Heading';
import {brand, support as copy, processArt} from '../../data/site';
import {useSignedIn} from '../auth/useSignedIn';
import {useApi} from '../../lib/api/useApi';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';
import {Callback} from './Callback';
import {LiveChat} from './LiveChat';
import {NewTicket} from './NewTicket';
import {TicketList} from './TicketList';
import {ArtFigure} from '../../components/ArtFigure';

export function Support() {
  const {redirect, user} = useSignedIn();
  const [params, setParams] = useSearchParams();
  const tickets = useApi(user ? '/support' : null);
  const from = getProduct(params.get('product') ?? '');
  const tab = copy.tabs.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'tickets';
  const [copied, setCopied] = useState(false);
  const ref = useRef(null);
  usePageMotion(ref, [Boolean(tickets.data), tab]);
  usePageMeta({title: `Support — ${from?.name ?? 'Pirento'}`});
  if (redirect) return redirect;

  const open = (id) => {
    const next = new URLSearchParams(params);
    next.set('tab', id);
    setParams(next, {replace: true});
  };
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(brand.supportEmail);
      setCopied(true);
    } catch {
      // Clipboard can be blocked; the address is on screen to copy by hand.
    }
  };
  const product = from?.slug ?? '';

  return (
    <div ref={ref} className="space-y-12">
      <header>
        <p className="eyebrow">
          {from ? `${from.name} · ` : ''}
          {copy.title}
        </p>
        <Heading as="h1" text={copy.heading} className="mt-5 text-[clamp(2.25rem,4.4vw,3.75rem)] leading-[1.02]" />
        <p className="body mt-4">{copy.intro}</p>
      </header>

      <nav aria-label="Ways to reach us" className="flex flex-wrap gap-2 border-b border-rule pb-4">
        {copy.tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => open(t.id)}
            aria-current={tab === t.id ? 'page' : undefined}
            className={`rounded-full px-5 py-2.5 text-sm ${tab === t.id ? 'bg-ink text-paper' : 'border border-rule hover:border-ink'}`}
          >
            {t.label}
            {t.id === 'tickets' && tickets.data?.length > 0 && (
              <span className="ml-2 tabular-nums opacity-70">
                {tickets.data.filter((x) => x.status !== 'closed').length}
              </span>
            )}
          </button>
        ))}
      </nav>

      {tab === 'tickets' && (
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-7">
            <DashSection n={1} id="new" label="New request" title="Tell us / what you need.">
              <NewTicket product={product} orderNo={(params.get('order') ?? '').replace(/\D/g, '')} />
            </DashSection>
          </div>
          <div className="min-w-0 lg:col-span-5">
            <DashSection n={2} id="mine" label="Your requests" title="Every product, / one place.">
              <TicketList tickets={tickets.data} />
            </DashSection>
            <ArtFigure {...processArt.support} className="mt-12" />
          </div>
        </div>
      )}

      {tab === 'chat' && (
        <DashSection n={1} id="chat" label={copy.tabs[1].label} title={copy.chat.title}>
          <LiveChat tickets={tickets.data} product={product} onStarted={tickets.reload} />
        </DashSection>
      )}

      {tab === 'email' && (
        <DashSection n={1} id="email" label={copy.tabs[2].label} title={copy.email.title}>
          <p className="text-muted">{copy.email.intro}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a
              href={`mailto:${brand.supportEmail}${from ? `?subject=${encodeURIComponent(from.name)}` : ''}`}
              className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-on-accent"
            >
              {brand.supportEmail}
            </a>
            <button
              type="button"
              onClick={copyEmail}
              className="rounded-full border border-rule px-5 py-3 text-sm hover:border-ink"
            >
              {copied ? 'Copied' : 'Copy address'}
            </button>
          </div>
        </DashSection>
      )}

      {tab === 'call' && (
        <DashSection n={1} id="call" label={copy.tabs[3].label} title={copy.call.title}>
          <p className="mb-6 text-muted">{copy.call.intro}</p>
          <Callback product={product} onDone={tickets.reload} />
        </DashSection>
      )}
    </div>
  );
}
