// Dashboard for the order-based products (Legal, Black, Green, Giftox), each its own app with its own sections
// (data/site.js productDashboards), in the design system's patterns and the product's colours.
import {useRef, useState} from 'react';
import {Link, Navigate} from 'react-router-dom';
import {
  BadgeCheck,
  Building2,
  Calculator,
  CircleCheck,
  Copyright,
  Download,
  CreditCard,
  FileText,
  Gavel,
  Mail,
  MessageSquare,
  MessagesSquare,
  Package,
  PenLine,
  Receipt,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {LEGAL_CATALOGUE, legalServiceSlug, needsDetails} from '@pirento/shared';
import {StatsRow} from '../../components/ui/Blocks';
import {Button} from '../../components/ui/Button';
import {DashSection} from '../../components/ui/DashSection';
import {Heading} from '../../components/ui/Heading';
import {green, orderDashboard as copy, productDashboards} from '../../data/site';
import {GreenTrees} from './GreenTrees';
import {Market} from '../green/Market';
import {Snapshot} from '../green/Snapshot';
import {Portfolio} from '../green/Portfolio';
import {Certificates} from '../green/Certificates';
import {AI_TOOLS_FOR} from '../../data/aiTools';
import {AiToolBox} from '../ai/AiTool';
import {useSignedIn} from '../auth/useSignedIn';
import {OrderRow} from '../orders/OrderRow';
import {ReceiptList} from '../orders/ReceiptList';
import {mb, saveFile} from '../../lib/api/binary';
import {formatDate} from '../../lib/format';
import {useApi} from '../../lib/api/useApi';
import {inr} from '../../lib/format';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';
import {useLegalAreas, useServicesFor} from '../../lib/prices';

const OPEN = ['pending_payment', 'paid', 'in_progress'];
// One icon per area of law, in the catalogue's order; anything new falls back to a document.
const AREA_ICONS = [
  Building2,
  BadgeCheck,
  Receipt,
  Calculator,
  ShieldCheck,
  PenLine,
  Copyright,
  Mail,
  FileText,
  Users,
  Gavel,
  MessagesSquare,
];
const FILTERS = [
  {id: 'open', label: 'Open', test: (o) => OPEN.includes(o.status)},
  {id: 'done', label: 'Completed', test: (o) => o.status === 'completed'},
  {id: 'all', label: 'All', test: () => true},
];

/** A card with a round outlined badge that fills with the product's colour on hover. */
function Card({to, icon: Icon, title, body, meta}) {
  return (
    <Link
      to={to}
      className="group flex h-full flex-col rounded-[18px] border border-rule p-5 transition-[border-color,transform] duration-500 ease-ui hover:-translate-y-1 hover:border-ink"
      data-reveal
    >
      <span className="flex size-11 items-center justify-center rounded-full border border-rule transition-colors duration-500 group-hover:border-accent group-hover:bg-accent group-hover:text-on-accent">
        <Icon aria-hidden className="size-5" />
      </span>
      <span className="mt-6 block font-medium sm:text-lg">{title}</span>
      {body && <span className="mt-1 block text-sm text-muted">{body}</span>}
      {meta && <span className="mt-auto block pt-5 text-sm tabular-nums">{meta}</span>}
    </Link>
  );
}

/** Legal: its areas of law (and any new ones made in admin) with how many services each sells. The others: their services with live prices. */
function StartGrid({product, browse, limit}) {
  const services = useServicesFor(product.slug);
  const areas = useLegalAreas();
  const items =
    product.slug === 'legal'
      ? areas.map((a) => ({
          key: a.title,
          to: `/legal/services#${a.anchor}`,
          icon: AREA_ICONS[LEGAL_CATALOGUE.findIndex((c) => c.title === a.title)] ?? FileText,
          title: a.title,
          meta: `${a.count} services`,
        }))
      : services
          .filter((s) => s.price)
          .map((s) => ({key: s.slug, to: `/services/${s.slug}`, icon: Package, title: s.name, meta: inr(s.price)}));
  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {items.slice(0, limit ?? items.length).map((it) => (
          <li key={it.key}>
            <Card to={it.to} icon={it.icon} title={it.title} meta={it.meta} />
          </li>
        ))}
      </ul>
      {limit && items.length > limit && (
        <div className="mt-8">
          <Button to={browse} variant="outline">
            See all {items.length}
          </Button>
        </div>
      )}
    </>
  );
}

/** Every document on this product's orders, newest first; each names its order and downloads on click. */
function Documents({product, mine}) {
  const files = useApi(`/orders/files/mine?product=${product.slug}`);
  const orderOf = (f) => mine.find((o) => o._id === f.orderId);
  const [error, setError] = useState('');
  if (files.data?.length === 0) return <p className="text-muted">{copy.documents.empty}</p>;
  return (
    <>
      <ul className="border-t border-rule">
        {files.data?.map((f) => {
          const o = orderOf(f);
          return (
            <li key={f._id} className="flex items-center gap-4 border-b border-rule py-4" data-reveal>
              <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-rule">
                <FileText aria-hidden className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{f.name}</span>
                <span className="block text-sm text-muted">
                  {f.from === 'team' ? 'From the Pirento team' : 'From you'} · {mb(f.size)} · {formatDate(f.createdAt)}
                  {o && (
                    <>
                      {' · '}
                      <Link to={`/${product.slug}/dashboard/orders/${o._id}`} className="underline underline-offset-4">
                        {o.serviceName} #{o.orderNo}
                      </Link>
                    </>
                  )}
                </span>
              </span>
              <button
                onClick={() =>
                  saveFile(`/orders/${f.orderId}/files/${f._id}`, f.name).catch((e) => setError(e.message))
                }
                aria-label={`Download ${f.name}`}
                className="flex size-10 shrink-0 items-center justify-center rounded-full border border-rule hover:border-ink"
              >
                <Download aria-hidden className="size-4" />
              </button>
            </li>
          );
        })}
      </ul>
      {error && (
        <p role="alert" className="mt-3 text-sm">
          ⚠ {error}
        </p>
      )}
    </>
  );
}

/** Legal's consultations: the calls you can book (live prices), and the ones you have booked. */
function Consultations({mine, orders, browse, product}) {
  const services = useServicesFor('legal');
  const area = LEGAL_CATALOGUE.find((c) => c.title === copy.consultations.area);
  const slugs = (area?.services ?? []).map((name) => legalServiceSlug(name));
  const bookable = slugs.map((slug) => services.find((s) => s.slug === slug)).filter((s) => s?.price);
  const booked = mine.filter((o) => slugs.includes(o.serviceSlug));
  return (
    <div className="space-y-12">
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {bookable.slice(0, 4).map((s) => (
          <li key={s.slug}>
            <Card to={`/services/${s.slug}`} icon={MessagesSquare} title={s.name} meta={`${inr(s.price)} · book`} />
          </li>
        ))}
      </ul>
      {bookable.length > 4 && (
        <div>
          <p className="eyebrow">More in {copy.consultations.area}</p>
          <ul className="mt-4 border-t border-rule">
            {bookable.slice(4).map((s) => (
              <li key={s.slug}>
                <Link
                  to={`/services/${s.slug}`}
                  className="flex items-center justify-between gap-4 border-b border-rule py-3.5 hover:underline"
                >
                  <span>{s.name}</span>
                  <span className="text-sm tabular-nums text-muted">{inr(s.price)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <p className="eyebrow">{copy.consultations.mine}</p>
        <div className="mt-4">
          <OrderList
            orders={orders}
            mine={booked}
            browse={browse}
            product={product}
            empty="No consultations booked yet."
          />
        </div>
      </div>
    </div>
  );
}

function OrderList({orders, mine, browse, product, empty = copy.orders.empty}) {
  if (orders.error) return <p className="text-muted">⚠ {orders.error.message}</p>;
  if (orders.data && mine.length === 0)
    return (
      <p className="text-muted">
        {empty}{' '}
        <Link to={browse} className="text-ink underline underline-offset-4">
          Browse {product.short} services
        </Link>
      </p>
    );
  return (
    <ul className="border-t border-rule">
      {mine.map((o) => (
        <OrderRow key={o._id} order={o} />
      ))}
    </ul>
  );
}

/** What is waiting on the customer: orders to pay, and orders where the team wrote last. */
function Waiting({toPay, details, replies, base}) {
  const items = [
    ...details.map((o) => ({
      key: `details-${o._id}`,
      icon: PenLine,
      title: `Send the details for ${o.serviceName}`,
      note: `Order #${o.orderNo} · ${o.afterQuestions.length} question${o.afterQuestions.length === 1 ? '' : 's'} so the team can start`,
      cta: 'Answer',
      accent: true,
      to: `${base}/orders/${o._id}#details`,
    })),
    ...toPay.map((o) => ({
      key: `pay-${o._id}`,
      icon: CreditCard,
      title: `Pay for ${o.serviceName}`,
      note: `Order #${o.orderNo} · ${inr(o.amount / 100)}`,
      cta: 'Pay now',
      accent: true,
      to: `${base}/orders/${o._id}`,
    })),
    ...replies.map((o) => ({
      key: `reply-${o._id}`,
      icon: MessageSquare,
      title: `The team wrote about ${o.serviceName}`,
      note: o.messages.at(-1).body,
      cta: 'Read',
      to: `${base}/orders/${o._id}#messages`,
    })),
  ];
  if (items.length === 0)
    return (
      <p className="flex items-center gap-2 text-muted">
        <CircleCheck aria-hidden className="size-4" /> {copy.waiting.empty}
      </p>
    );
  return (
    <ul className="border-t border-rule">
      {items.map((it) => (
        <li key={it.key} className="flex items-center gap-4 border-b border-rule py-4" data-reveal>
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-rule">
            <it.icon aria-hidden className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-medium sm:truncate">{it.title}</span>
            <span className="line-clamp-1 block text-sm text-muted">{it.note}</span>
          </span>
          <Link
            to={it.to}
            className={`shrink-0 rounded-full px-4 py-2 text-sm ${
              it.accent ? 'bg-accent font-medium text-on-accent' : 'border border-rule hover:border-ink'
            }`}
          >
            {it.cta}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function OrdersDashboard({product, section = 'overview'}) {
  const {redirect, user} = useSignedIn();
  const orders = useApi(user ? '/orders' : null);
  const wallet = useApi(user ? '/wallet' : null);
  const [filter, setFilter] = useState('open');
  const ref = useRef(null);
  const sections = productDashboards[product.slug];
  const current = sections.find((s) => s.id === section);
  usePageMotion(ref, [Boolean(orders.data), section]);
  usePageMeta({title: `${current?.label ?? 'Dashboard'} — ${product.name}`});
  if (redirect) return redirect;
  if (!current) return <Navigate to={`/${product.slug}/dashboard`} replace />;
  if (!user) return <div className="min-h-dvh" />;

  const mine = orders.data?.filter((o) => o.product === product.slug) ?? [];
  const toPay = mine.filter((o) => o.status === 'pending_payment');
  const working = mine.filter((o) => ['paid', 'in_progress'].includes(o.status));
  const done = mine.filter((o) => o.status === 'completed');
  // The team wrote last and the order is still live: the customer probably owes a reply.
  const replies = mine.filter((o) => o.status !== 'cancelled' && o.messages?.at(-1)?.from === 'team');
  const details = mine.filter(needsDetails);
  const paidTotal = [...working, ...done].reduce((n, o) => n + o.amount, 0);
  const browse = product.slug === 'legal' ? '/legal/services' : `/${product.slug}#services`;
  const ordersLabel = sections.find((s) => s.id === 'orders').label;
  const base = `/${product.slug}/dashboard`;
  const name = user.name?.trim().split(/\s+/)[0];
  let n = 0;

  return (
    <div ref={ref} className="space-y-14 md:space-y-16">
      <header className="flex flex-wrap items-end justify-between gap-8">
        <div className="min-w-0">
          <p className="eyebrow">
            {product.name} · {current.label}
          </p>
          <Heading
            as="h1"
            text={
              section === 'overview' ? (name ? `Hello, / ${name}.` : `Your ${product.short} / work.`) : current.label
            }
            className="mt-5 text-[clamp(2.25rem,4.4vw,3.75rem)] leading-[1.02] break-words"
          />
          {section === 'overview' && (
            <p className="body mt-4" aria-live="polite">
              {!orders.data
                ? 'Loading your orders…'
                : mine.length === 0
                  ? `No ${product.short} orders yet. Start with the areas below.`
                  : `${working.length} in progress · ${toPay.length} waiting for payment · ${done.length} completed.`}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button to={browse} variant="accent">
            New order
          </Button>
          <Button to={`/support?product=${product.slug}`} variant="outline" icon={MessageSquare}>
            Ask support
          </Button>
        </div>
      </header>

      {section === 'overview' && (
        <>
          <DashSection n={++n} id="glance" label={copy.glance.label} title={copy.glance.title}>
            <StatsRow
              compact
              stats={[
                {value: orders.data ? String(working.length) : '—', label: 'in progress'},
                {value: orders.data ? String(toPay.length) : '—', label: 'to pay'},
                {value: orders.data ? String(done.length) : '—', label: 'completed'},
                {value: orders.data ? inr(paidTotal / 100) : '—', label: 'paid in all'},
                // The one Pirento wallet, the same balance in every product.
                {value: wallet.data ? inr(wallet.data.balance / 100) : '—', label: 'wallet'},
              ]}
            />
          </DashSection>
          {product.slug === 'green' && (
            <DashSection n={++n} id="carbon" label={green.snapshot.label} title={green.snapshot.title}>
              <Snapshot />
            </DashSection>
          )}
          <DashSection n={++n} id="waiting" label={copy.waiting.label} title={copy.waiting.title}>
            <Waiting toPay={toPay} details={details} replies={replies} base={base} />
          </DashSection>
          <DashSection
            n={++n}
            id="recent"
            label={copy.recent.label}
            title={copy.recent.title}
            action={
              <Link
                to={`${base}/orders`}
                className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
              >
                All {ordersLabel.toLowerCase()}
              </Link>
            }
          >
            <OrderList orders={orders} mine={mine.slice(0, 5)} browse={browse} product={product} />
          </DashSection>
          <DashSection
            n={++n}
            id="start"
            label={copy.start.label}
            title={product.slug === 'legal' ? copy.start.legalTitle : copy.start.title}
          >
            <StartGrid product={product} browse={`${base}/services`} limit={6} />
          </DashSection>
          {AI_TOOLS_FOR[product.slug] && (
            <DashSection n={++n} id="ai" label="Pirento AI" title="Let AI / do the first step.">
              <AiToolBox product={product.slug} />
            </DashSection>
          )}
        </>
      )}

      {section === 'orders' && (
        <DashSection
          n={1}
          id="orders"
          label={ordersLabel}
          title={copy.orders.title}
          action={
            <div role="tablist" aria-label="Show" className="flex gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  role="tab"
                  aria-selected={filter === f.id}
                  onClick={() => setFilter(f.id)}
                  className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                    filter === f.id ? 'border-ink bg-ink text-paper' : 'border-rule hover:border-ink'
                  }`}
                >
                  {f.label} <span className="tabular-nums opacity-70">{mine.filter(f.test).length}</span>
                </button>
              ))}
            </div>
          }
        >
          <OrderList
            orders={orders}
            mine={mine.filter(FILTERS.find((f) => f.id === filter).test)}
            browse={browse}
            product={product}
          />
        </DashSection>
      )}

      {section === 'documents' && (
        <DashSection n={1} id="documents" label={copy.documents.label} title={copy.documents.title}>
          <p className="body -mt-2 mb-8">{copy.documents.intro}</p>
          <Documents product={product} mine={mine} />
        </DashSection>
      )}

      {section === 'consultations' && (
        <DashSection n={1} id="consultations" label={copy.consultations.label} title={copy.consultations.title}>
          <p className="body -mt-2 mb-8">{copy.consultations.intro}</p>
          <Consultations mine={mine} orders={orders} browse={browse} product={product} />
        </DashSection>
      )}

      {section === 'portfolio' && (
        <DashSection n={1} id="portfolio" label={green.portfolio.label} title={green.portfolio.title}>
          <Portfolio mine={mine} loading={!orders.data} />
        </DashSection>
      )}

      {section === 'certificates' && (
        <DashSection n={1} id="certificates" label={green.certificate.label} title={green.certificate.title}>
          <Certificates mine={mine} loading={!orders.data} />
        </DashSection>
      )}

      {section === 'market' && (
        <DashSection n={1} id="market" label={green.market.label} title={green.market.title}>
          <Market />
        </DashSection>
      )}

      {section === 'trees' && (
        <DashSection n={1} id="trees" label={green.trees.label} title={green.trees.title}>
          <p className="body -mt-2 mb-8">{green.trees.intro}</p>
          <GreenTrees mine={mine} loading={!orders.data} />
        </DashSection>
      )}

      {section === 'receipts' && (
        <DashSection n={1} id="receipts" label="Receipts" title="Every payment, / ready to print.">
          <ReceiptList orders={orders.data && mine} />
        </DashSection>
      )}

      {section === 'services' && (
        <DashSection
          n={1}
          id="services"
          label={current.label}
          title={product.slug === 'legal' ? copy.start.legalTitle : copy.start.title}
        >
          <StartGrid product={product} browse={browse} />
        </DashSection>
      )}
    </div>
  );
}
