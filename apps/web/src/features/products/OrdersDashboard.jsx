// Dashboard for the order-based products (Legal, Black, Green, Giftox), in the design system's patterns and the
// product's own colours: numbers, what needs you, every order with its progress, what to start, and help.
import {useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import {
  ArrowUpRight,
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
import {LEGAL_CATALOGUE, ORDER_STEPS, statusLabel} from '@pirento/shared';
import {StatsRow} from '../../components/ui/Blocks';
import {Button} from '../../components/ui/Button';
import {DashSection} from '../../components/ui/DashSection';
import {Heading} from '../../components/ui/Heading';
import {Tag} from '../../components/ui/Tag';
import {orderDashboard as copy} from '../../data/site';
import {useSignedIn} from '../auth/useSignedIn';
import {useApi} from '../../lib/api/useApi';
import {formatDate, inr} from '../../lib/format';
import {usePageMotion} from '../../lib/motion';
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

/** Where an order is, as four joined dots: awaiting payment → paid → in progress → completed. */
function Progress({status}) {
  const at = ORDER_STEPS.findIndex((s) => s.status === status);
  if (at < 0) return null; // cancelled: the tag says so
  return (
    <span className="flex items-center" aria-hidden>
      {ORDER_STEPS.map((s, i) => (
        <span key={s.status} className="flex items-center">
          {i > 0 && <span className={`h-px w-4 sm:w-6 ${i <= at ? 'bg-ink' : 'bg-rule'}`} />}
          <span className={`size-2 rounded-full ${i <= at ? 'bg-accent' : 'border border-rule'}`} />
        </span>
      ))}
    </span>
  );
}

function OrderRow({order}) {
  return (
    <li data-reveal>
      <Link
        to={`/orders/${order._id}`}
        className="group grid gap-x-6 gap-y-3 border-b border-rule py-5 sm:grid-cols-[1fr_auto] sm:items-center"
      >
        <span className="min-w-0">
          <span className="block font-medium group-hover:underline">
            {order.serviceName}
            {order.quantity > 1 && ` × ${order.quantity}`}
          </span>
          <span className="mt-1 block text-sm text-muted">
            #{order.orderNo} · {formatDate(order.createdAt)}
            {order.code && ` · code ${order.code}`}
          </span>
        </span>
        <span className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Progress status={order.status} />
          <Tag tone={order.status === 'completed' ? 'accent' : 'rule'}>{statusLabel(order.status)}</Tag>
          <span className="tabular-nums">{inr(order.amount / 100)}</span>
          <ArrowUpRight aria-hidden className="hidden size-4 text-muted sm:block" />
        </span>
      </Link>
    </li>
  );
}

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
function StartGrid({product, browse}) {
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
        {items.slice(0, 6).map((it) => (
          <li key={it.key}>
            <Card to={it.to} icon={it.icon} title={it.title} meta={it.meta} />
          </li>
        ))}
      </ul>
      {items.length > 6 && (
        <div className="mt-8">
          <Button to={browse} variant="outline">
            See all {items.length}
          </Button>
        </div>
      )}
    </>
  );
}

export function OrdersDashboard({product}) {
  const {redirect, user} = useSignedIn();
  const orders = useApi(user ? '/orders' : null);
  const [filter, setFilter] = useState('open');
  const ref = useRef(null);
  usePageMotion(ref, [Boolean(orders.data)]);
  if (redirect) return redirect;
  if (!user) return <div className="min-h-dvh" />;

  const mine = orders.data?.filter((o) => o.product === product.slug) ?? [];
  const toPay = mine.filter((o) => o.status === 'pending_payment');
  const working = mine.filter((o) => ['paid', 'in_progress'].includes(o.status));
  const done = mine.filter((o) => o.status === 'completed');
  const paidTotal = [...working, ...done].reduce((n, o) => n + o.amount, 0);
  const shown = mine.filter(FILTERS.find((f) => f.id === filter).test);
  const browse = product.slug === 'legal' ? '/legal/services' : `/${product.slug}#services`;
  const name = user.name?.trim().split(/\s+/)[0];
  const summary = !orders.data
    ? 'Loading your orders…'
    : mine.length === 0
      ? `No ${product.short} orders yet. Start with the areas below.`
      : `${working.length} in progress · ${toPay.length} waiting for payment · ${done.length} completed.`;
  let n = 0;

  return (
    <div ref={ref} className="space-y-14 md:space-y-16">
      <header className="flex flex-wrap items-end justify-between gap-8">
        <div className="min-w-0">
          <p className="eyebrow">{product.name} · Dashboard</p>
          <Heading
            as="h1"
            text={name ? `Hello, / ${name}.` : `Your ${product.short} / work.`}
            className="mt-5 text-[clamp(2.25rem,4.4vw,3.75rem)] leading-[1.02] break-words"
          />
          <p className="body mt-4" aria-live="polite">
            {summary}
          </p>
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
        {toPay.length === 0 ? (
          <p className="flex items-center gap-2 text-muted">
            <CircleCheck aria-hidden className="size-4" /> {copy.waiting.empty}
          </p>
        ) : (
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
        )}
      </DashSection>

      <DashSection
        n={++n}
        id="orders"
        label={copy.orders.label}
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
        {orders.error && <p className="text-muted">⚠ {orders.error.message}</p>}
        {orders.data && shown.length === 0 ? (
          <p className="text-muted">
            {mine.length === 0 ? copy.orders.empty : 'Nothing here.'}{' '}
            <Link to={browse} className="text-ink underline underline-offset-4">
              Browse {product.short} services
            </Link>
          </p>
        ) : (
          <ul className="border-t border-rule">
            {shown.map((o) => (
              <OrderRow key={o._id} order={o} />
            ))}
          </ul>
        )}
      </DashSection>

      <DashSection
        n={++n}
        id="start"
        label={copy.start.label}
        title={product.slug === 'legal' ? copy.start.legalTitle : copy.start.title}
      >
        <StartGrid product={product} browse={browse} />
      </DashSection>

      <DashSection n={++n} id="help" label={copy.help.label} title={copy.help.title}>
        <ul className="grid gap-4 sm:grid-cols-3">
          {copy.helpItems.map((h) => (
            <li key={h.to}>
              <Card to={h.to} icon={HELP_ICONS[h.icon]} title={h.title} body={h.body} />
            </li>
          ))}
        </ul>
      </DashSection>
    </div>
  );
}
