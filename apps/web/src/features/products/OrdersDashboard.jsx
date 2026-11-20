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
  CreditCard,
  FileText,
  Gavel,
  LifeBuoy,
  Mail,
  MessageSquare,
  MessagesSquare,
  Package,
  PenLine,
  Receipt,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import {LEGAL_CATALOGUE} from '@pirento/shared';
import {StatsRow} from '../../components/ui/Blocks';
import {Button} from '../../components/ui/Button';
import {DashSection} from '../../components/ui/DashSection';
import {Heading} from '../../components/ui/Heading';
import {orderDashboard as copy, productDashboards} from '../../data/site';
import {useSignedIn} from '../auth/useSignedIn';
import {OrderRow} from '../orders/OrderRow';
import {ReceiptList} from '../orders/ReceiptList';
import {useApi} from '../../lib/api/useApi';
import {inr} from '../../lib/format';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';
import {useServicesFor} from '../../lib/prices';

const OPEN = ['pending_payment', 'paid', 'in_progress'];
const HELP_ICONS = {support: LifeBuoy, ai: Sparkles, verify: Search};
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

/** Legal: its areas of law with how many services each has. The others: their services with live prices. */
function StartGrid({product, browse, limit}) {
  const services = useServicesFor(product.slug);
  const items =
    product.slug === 'legal'
      ? LEGAL_CATALOGUE.map((c, i) => ({
          key: c.title,
          to: `/legal/services#cat-${i}`,
          icon: AREA_ICONS[i] ?? FileText,
          title: c.title,
          meta: `${c.services.length} services`,
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

function OrderList({orders, mine, browse, product}) {
  if (orders.error) return <p className="text-muted">⚠ {orders.error.message}</p>;
  if (orders.data && mine.length === 0)
    return (
      <p className="text-muted">
        {copy.orders.empty}{' '}
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

function Waiting({toPay}) {
  if (toPay.length === 0)
    return (
      <p className="flex items-center gap-2 text-muted">
        <CircleCheck aria-hidden className="size-4" /> {copy.waiting.empty}
      </p>
    );
  return (
    <ul className="border-t border-rule">
      {toPay.map((o) => (
        <li key={o._id} className="flex items-center gap-4 border-b border-rule py-4" data-reveal>
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-rule">
            <CreditCard aria-hidden className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-medium sm:truncate">Pay for {o.serviceName}</span>
            <span className="block text-sm text-muted">
              Order #{o.orderNo} · {inr(o.amount / 100)}
            </span>
          </span>
          <Link
            to={`/orders/${o._id}`}
            className="shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-medium text-on-accent"
          >
            Pay now
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function OrdersDashboard({product, section = 'overview'}) {
  const {redirect, user} = useSignedIn();
  const orders = useApi(user ? '/orders' : null);
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
          <Button to="/support" variant="outline" icon={MessageSquare}>
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
              ]}
            />
          </DashSection>
          <DashSection n={++n} id="waiting" label={copy.waiting.label} title={copy.waiting.title}>
            <Waiting toPay={toPay} />
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

      {section === 'help' && (
        <DashSection n={1} id="help" label={copy.help.label} title={copy.help.title}>
          <ul className="grid gap-3 sm:grid-cols-3 sm:gap-4">
            {copy.helpItems.map((h) => (
              <li key={h.to}>
                <Card to={h.to} icon={HELP_ICONS[h.icon]} title={h.title} body={h.body} />
              </li>
            ))}
          </ul>
        </DashSection>
      )}
    </div>
  );
}
