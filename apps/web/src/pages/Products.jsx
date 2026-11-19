import {useRef} from 'react';
import {Link, useParams} from 'react-router-dom';
import {AlertTriangle} from 'lucide-react';
import {PRODUCTS, getProduct, servicesFor} from '@pirento/shared';
import {productApps, productIllustration} from '../data/site';
import {inr} from '../lib/api';
import {usePageMotion} from '../lib/motion';
import {usePageMeta} from '../lib/page';
import {Illustration} from '../components/Illustration';
import {ContactCta} from '../components/Footer';
import {Button, CheckList, Heading, Label, Section, SectionHeader, StatusTag, Steps} from '../components/ui';
import {NotFound} from './NotFound';

function PageHero({label, title, hl, intro, children}) {
  return (
    <section className="hero relative overflow-hidden pt-36 pb-16 md:pt-44 md:pb-24">
      <div aria-hidden className="grid-bg absolute inset-0" />
      <div className="container-x relative">
        <p className="eyebrow" data-hero-fade>
          {label}
        </p>
        <Heading as="h1" text={title} hl={hl} className="h-hero mt-6" />
        {intro && (
          <p className="body mt-8" data-hero-fade>
            {intro}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
export {PageHero};

/** Alternating feature row: illustration + meta, title, text, highlights, link. */
function FeatureRow({product, flip}) {
  return (
    <article className="grid gap-10 border-t border-rule py-16 lg:grid-cols-12 lg:items-center">
      <div className={`lg:col-span-6 ${flip ? 'lg:order-2' : ''}`} data-reveal>
        <Illustration name={productIllustration[product.slug]} />
      </div>
      <div className={`lg:col-span-5 ${flip ? 'lg:col-start-1' : 'lg:col-start-8'}`}>
        <p className="eyebrow" data-reveal>
          {product.short} · <StatusTag status={product.status} />
        </p>
        <h2 className="h-card mt-5" data-reveal>
          {product.name}
        </h2>
        <p className="body mt-4" data-reveal>
          {product.overview}
        </p>
        <div className="mt-6" data-reveal>
          <CheckList items={product.highlights.map((h) => h.title)} />
        </div>
        <div className="mt-8" data-reveal>
          <Button to={`/products/${product.slug}`} variant="outline" data-cursor="View">
            Open {product.short}
          </Button>
        </div>
      </div>
    </article>
  );
}

export function Products() {
  const ref = useRef(null);
  usePageMotion(ref);
  usePageMeta({title: 'Products — Pirento', description: 'Ten Pirento products on one account and one wallet.'});
  return (
    <div ref={ref}>
      <PageHero
        label="Products"
        title="Ten products. / One account."
        hl="One account."
        intro="Each product says what it does today, and what it does not do yet."
      />
      <div className="container-x pb-28">
        {PRODUCTS.map((p, i) => (
          <FeatureRow key={p.slug} product={p} flip={i % 2 === 1} />
        ))}
      </div>
      <ContactCta n={1} />
    </div>
  );
}

export function Product() {
  const {slug} = useParams();
  const product = getProduct(slug);
  const ref = useRef(null);
  usePageMotion(ref, [slug]);
  usePageMeta({title: `${product?.name ?? 'Not found'} — Pirento`, description: product?.overview});
  if (!product) return <NotFound />;
  const services = servicesFor(slug).filter((s) => s.price);

  return (
    <div ref={ref} key={slug}>
      <PageHero label={product.name} title={product.quote.replace(/, /, ', / ')} intro={product.overview}>
        <div className="mt-8 flex items-center gap-3" data-hero-fade>
          <StatusTag status={product.status} />
          {productApps[slug] && (
            <Button to={productApps[slug]} variant="accent">
              {slug === 'legal'
                ? 'Browse the catalogue'
                : productApps[slug].includes('#')
                  ? 'See prices'
                  : `Open ${product.short}`}
            </Button>
          )}
        </div>
      </PageHero>

      <Section className="pt-0! md:pt-0!">
        <SectionHeader n={1} label="What you get" title="What it does / today." />
        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {product.highlights.map((h, i) => (
            <div key={h.title} className="rounded-[18px] border border-rule bg-stone p-7" data-reveal>
              <span className="num text-base!">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-8 text-2xl">{h.title}</h3>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">{h.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex gap-4 rounded-[18px] border border-rule p-7" data-reveal>
          <AlertTriangle aria-hidden className="mt-1 size-5 shrink-0" />
          <p className="text-[0.95rem] leading-relaxed text-muted">
            <span className="font-medium text-ink">Limits: </span>
            {product.caveat}
          </p>
        </div>
      </Section>

      {services.length > 0 && (
        <Section id="services" className="pt-0! md:pt-0!">
          <SectionHeader n={2} label="Services" title="Prices you / see first." />
          <ul className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.slice(0, 9).map((s) => (
              <li key={s.slug} data-reveal>
                <Link
                  to={`/services/${s.slug}`}
                  className="flex h-full flex-col rounded-[18px] border border-rule p-6 transition-colors hover:border-ink"
                >
                  <span className="text-lg font-medium">{s.name}</span>
                  <span className="mt-1 text-sm text-muted">{s.deliveryTime ?? s.category}</span>
                  <span className="num mt-8">
                    {inr(s.price)}
                    {s.unit && <span className="text-base text-muted"> / {s.unit}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section className="border-t border-rule">
        <Label n={services.length ? 3 : 2}>How it works</Label>
        <Heading text="Three steps, / no surprises." className="h-section mt-6 mb-20" data-lines />
        <Steps steps={product.steps} />
      </Section>
      <ContactCta n={services.length ? 4 : 3} />
    </div>
  );
}
