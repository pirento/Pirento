import {useRef} from 'react';
import {Link, Navigate, useParams} from 'react-router-dom';
import {AlertTriangle, ArrowUpRight, MessageSquare} from 'lucide-react';
import {ID_SECTIONS, LEGAL_CATALOGUE, PRODUCTS, getProduct, servicesFor, statusLabel} from '@pirento/shared';
import {productIllustration} from '../data/site';
import {inr, useApi, useSession} from '../lib/api';
import {usePageMotion} from '../lib/motion';
import {usePageMeta, useTilt} from '../lib/page';
import {Illustration} from '../components/Illustration';
import {ContactCta} from '../components/Footer';
import {Button, Faq, Heading, Label, Section, SectionHeader, StatsRow, StatusTag, Steps, Tag} from '../components/ui';
import {NotFound} from './NotFound';
import {PageHero} from './Products';
import {formatDate, useSignedIn} from './Orders';
import {Intern} from './Intern';
import {Vault} from './Vault';
import {Ai} from './Ai';
import {One} from './One';
import {Capital} from './Capital';
import {BharatId} from './BharatId';

// "A, b." → two heading lines; the last line gets the highlighter.
const titleLines = (quote) => quote.replace(/([,;]) /, '$1 / ');

function Hero({product, index}) {
  const tilt = useTilt();
  const {user} = useSession();
  const dashboard = `/${product.slug}/dashboard`;
  const title = titleLines(product.quote);
  const hl = title.includes(' / ') ? title.split(' / ').at(-1) : undefined;
  const actions = (
    <div className="mt-10 flex flex-wrap gap-3" data-hero-fade>
      <Button to={user ? dashboard : `/login?next=${encodeURIComponent(dashboard)}`} variant="accent">
        {user ? 'Open dashboard' : `Sign in to ${product.short}`}
      </Button>
      <Button to={`#${product.services ? 'services' : 'how'}`} variant="outline">
        {product.services ? 'See prices' : 'How it works'}
      </Button>
    </div>
  );
  const meta = (
    <p className="eyebrow flex flex-wrap items-center gap-3" data-hero-fade>
      {product.name} <StatusTag status={product.status} />
    </p>
  );
  const art = (
    <div ref={tilt} className="transition-transform duration-300 ease-out">
      <Illustration
        name={productIllustration[product.slug]}
        className="shadow-[0_30px_80px_-40px_rgba(15,38,32,0.4)]"
      />
    </div>
  );

  // Two layouts, alternating across the ten sites, so each one feels like its own place.
  return index % 2 === 0 ? (
    <section className="hero relative overflow-hidden pt-36 pb-20 md:pt-44 md:pb-28">
      <div aria-hidden className="grid-bg absolute inset-0" />
      <div className="container-x relative grid gap-14 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-7">
          {meta}
          <Heading as="h1" text={title} hl={hl} className="h-hero mt-6" />
          <p className="body mt-8" data-hero-fade>
            {product.overview}
          </p>
          {actions}
        </div>
        <div className="lg:col-span-5" data-hero-visual>
          {art}
        </div>
      </div>
    </section>
  ) : (
    <section className="hero relative overflow-hidden pt-36 pb-20 text-center md:pt-44 md:pb-28">
      <div aria-hidden className="grid-bg absolute inset-0" />
      <div className="container-x relative flex flex-col items-center">
        {meta}
        <Heading as="h1" text={title} hl={hl} className="h-hero mt-6 max-w-5xl" />
        <p className="body mx-auto mt-8" data-hero-fade>
          {product.overview}
        </p>
        <div className="flex justify-center">{actions}</div>
        <div className="mt-16 w-full max-w-4xl" data-hero-visual>
          {art}
        </div>
      </div>
    </section>
  );
}

/** The part that is different on every site. */
function Extra({product}) {
  const services = servicesFor(product.slug).filter((s) => s.price);
  if (services.length) {
    const list = product.slug === 'legal' ? services.slice(0, 9) : services;
    return (
      <Section id="services" className="pt-0! md:pt-0!">
        <SectionHeader
          n={2}
          label="Services"
          title="Prices you / see first."
          intro={
            product.slug === 'legal'
              ? `${services.length} services across ${LEGAL_CATALOGUE.length} categories.`
              : undefined
          }
        />
        <ul className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((s) => (
            <li key={s.slug} data-reveal>
              <Link
                to={`/services/${s.slug}`}
                data-cursor="View"
                className="group flex h-full flex-col rounded-[18px] border border-rule p-6 transition-[border-color,transform] duration-500 ease-ui hover:-translate-y-1 hover:border-ink"
              >
                <span className="text-sm text-muted">{s.category}</span>
                <span className="mt-2 text-lg font-medium">{s.name}</span>
                {s.description && <span className="mt-2 text-sm text-muted">{s.description}</span>}
                <span className="num mt-auto pt-8">
                  {inr(s.price)}
                  {s.unit && <span className="text-base text-muted"> / {s.unit}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {product.slug === 'legal' && (
          <div className="mt-10" data-reveal>
            <Button to="/legal/services" variant="outline">
              All {services.length} legal services
            </Button>
          </div>
        )}
      </Section>
    );
  }
  const blocks = {
    intern: {title: 'Five tracks, / one exam each.', items: product.tracks},
    'bharat-id': {title: 'Eight short / steps.', items: [...ID_SECTIONS.map((s) => s.title), 'Review and submit']},
    vault: {
      title: 'What happens / to your files.',
      items: [
        'Sealed with AES-256-GCM, a fresh IV per item',
        'Files up to 5 MB, 50 MB in all',
        'Passwords never shown in lists, only on request',
        'Downloads are never opened in the browser',
        'Pirento holds the key: not end-to-end encrypted',
      ],
    },
    ai: {title: 'Ask it / like this.', items: product.examples},
  };
  const b = blocks[product.slug];
  if (!b) return null;
  return (
    <Section className="pt-0! md:pt-0!">
      <SectionHeader n={2} label={product.short} title={b.title} />
      <ol className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {b.items.map((item, i) => (
          <li key={item} className="flex items-start gap-4 rounded-[18px] border border-rule bg-stone p-6" data-reveal>
            <span className="num text-base! text-muted">{String(i + 1).padStart(2, '0')}</span>
            <span className="text-lg">{item}</span>
          </li>
        ))}
      </ol>
    </Section>
  );
}

export function ProductHome() {
  const {slug} = useParams();
  const product = getProduct(slug);
  const ref = useRef(null);
  usePageMotion(ref, [slug]);
  usePageMeta({title: product ? `${product.name} — ${product.overview}` : 'Not found', description: product?.overview});
  if (!product) return <NotFound />;
  const index = PRODUCTS.indexOf(product);
  const withServices = {...product, services: servicesFor(slug).some((s) => s.price)};

  return (
    <div ref={ref} key={slug}>
      <Hero product={withServices} index={index} />
      <Section className="pt-0! md:pt-0!">
        <SectionHeader n={1} label="What you get" title="What it does / today." />
        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {product.highlights.map((h, i) => (
            <div
              key={h.title}
              className="group rounded-[18px] border border-rule p-7 transition-[border-color,transform] duration-500 ease-ui hover:-translate-y-1 hover:border-ink"
              data-reveal
            >
              <span className="flex size-11 items-center justify-center rounded-full border border-rule transition-colors duration-500 group-hover:border-accent group-hover:bg-accent group-hover:text-on-accent">
                <span className="text-sm tabular-nums">{String(i + 1).padStart(2, '0')}</span>
              </span>
              <h3 className="mt-8 text-2xl">{h.title}</h3>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">{h.body}</p>
            </div>
          ))}
        </div>
      </Section>
      <Extra product={product} />
      <section id="how" className="inverse py-28 md:py-40">
        <div className="container-x">
          <Label n={3}>How it works</Label>
          <Heading text="From first click / to done." className="h-section mt-6 mb-20" data-lines />
          <Steps steps={product.steps} />
        </div>
      </section>
      <Section>
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <SectionHeader n={4} label="Questions" title="Before you / begin." />
          </div>
          <div className="md:col-span-8">
            <Faq items={product.faq} />
            <div className="mt-8 flex gap-4 rounded-[18px] border border-rule p-6" data-reveal>
              <AlertTriangle aria-hidden className="mt-1 size-5 shrink-0" />
              <p className="text-[0.95rem] leading-relaxed text-muted">
                <span className="font-medium text-ink">Limits: </span>
                {product.caveat}
              </p>
            </div>
          </div>
        </div>
      </Section>
      <ContactCta n={5} />
    </div>
  );
}

// ── Dashboards ───────────────────────────────────────────────────────────

const ACTIVE = ['paid', 'in_progress'];

/** Legal, Black, Green and Giftox: your orders for that product. */
function OrdersDashboard({product}) {
  const {redirect, user} = useSignedIn();
  const orders = useApi(user ? '/orders' : null);
  const ref = useRef(null);
  usePageMotion(ref, [Boolean(orders.data)]);
  if (redirect) return redirect;
  const mine = orders.data?.filter((o) => o.product === product.slug) ?? [];
  const paid = mine.filter((o) => [...ACTIVE, 'completed'].includes(o.status));
  const browse = product.slug === 'legal' ? '/legal/services' : `/${product.slug}#services`;

  return (
    <div ref={ref}>
      <PageHero
        label={`${product.name} · Dashboard`}
        title={`Hello, / ${user?.name || user?.email.split('@')[0] || ''}.`}
      >
        <div className="mt-8 flex flex-wrap gap-3" data-hero-fade>
          <Button to={browse} variant="accent">
            New order
          </Button>
          <Button to="/support" variant="outline" icon={MessageSquare}>
            Ask support
          </Button>
        </div>
      </PageHero>
      <Section className="pt-0! md:pt-0!">
        <StatsRow
          stats={[
            {value: String(mine.length), label: 'orders'},
            {value: String(mine.filter((o) => ACTIVE.includes(o.status)).length), label: 'in progress'},
            {value: String(mine.filter((o) => o.status === 'completed').length), label: 'completed'},
            {value: inr(paid.reduce((n, o) => n + o.amount, 0) / 100), label: 'paid in all'},
          ]}
        />
        <div className="mt-16">
          <Label n={1}>Your {product.short} orders</Label>
          {orders.data && mine.length === 0 && (
            <p className="body mt-6">
              Nothing yet.{' '}
              <Link to={browse} className="text-ink underline underline-offset-4">
                Browse {product.short} services
              </Link>
              .
            </p>
          )}
          <ul className="mt-6">
            {mine.map((o) => (
              <li key={o._id}>
                <Link
                  to={`/orders/${o._id}`}
                  className="flex flex-wrap items-center justify-between gap-4 border-b border-rule py-5 hover:border-ink"
                >
                  <span>
                    <span className="block font-medium">
                      {o.serviceName}
                      {o.quantity > 1 && ` × ${o.quantity}`}
                    </span>
                    <span className="text-sm text-muted">
                      #{o.orderNo} · {formatDate(o.createdAt)}
                      {o.code && ` · ${o.code}`}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <Tag tone={o.status === 'completed' ? 'accent' : 'rule'}>{statusLabel(o.status)}</Tag>
                    <span className="tabular-nums">{inr(o.amount / 100)}</span>
                    <ArrowUpRight aria-hidden className="size-4" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Section>
    </div>
  );
}

const APPS = {intern: Intern, vault: Vault, ai: Ai, one: One, capital: Capital, 'bharat-id': BharatId};

export function ProductDashboard() {
  const {slug} = useParams();
  const product = getProduct(slug);
  usePageMeta({title: product ? `${product.name} · Dashboard` : 'Not found'});
  if (!product) return <NotFound />;
  const App = APPS[slug];
  return App ? <App /> : <OrdersDashboard product={product} />;
}

export const ProductRedirect = () => {
  const {slug} = useParams();
  return <Navigate to={`/${slug}`} replace />;
};
