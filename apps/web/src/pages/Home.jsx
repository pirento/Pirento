import {useRef} from 'react';
import {Link} from 'react-router-dom';
import {ArrowUpRight} from 'lucide-react';
import {LEGAL_CATALOGUE, PRODUCTS, SERVICES} from '@pirento/shared';
import {home, productIllustration, stats} from '../data/site';
import {inr} from '../lib/api';
import {usePageMotion} from '../lib/motion';
import {usePageMeta, useTilt} from '../lib/page';
import {Illustration} from '../components/Illustration';
import {ContactCta} from '../components/Footer';
import {Button, Faq, Heading, Section, SectionHeader, StatsRow, StatusTag, Steps, Tag} from '../components/ui';

// Each card wears its product's own colour, a preview of that product's site.
export function ProductCard({product}) {
  return (
    <Link
      to={`/${product.slug}`}
      data-reveal
      data-cursor="Visit"
      style={{'--brand': product.color, '--on-brand': product.onColor}}
      className="group flex flex-col rounded-[18px] border border-rule bg-paper p-6 transition-[border-color,transform] duration-500 ease-ui hover:-translate-y-1 hover:border-(--brand)"
    >
      <div className="flex items-start justify-between">
        <span className="relative flex size-11 items-center justify-center rounded-full border border-rule transition-colors duration-500 group-hover:border-(--brand) group-hover:bg-(--brand) group-hover:text-(--on-brand)">
          <span aria-hidden className="size-2.5 rounded-[3px] bg-(--brand) transition-opacity group-hover:opacity-0" />
          <ArrowUpRight aria-hidden className="absolute size-4 opacity-0 transition-opacity group-hover:opacity-100" />
        </span>
        <StatusTag status={product.status} />
      </div>
      <h3 className="mt-10 text-2xl">{product.name}</h3>
      <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{product.overview}</p>
    </Link>
  );
}

const featured = ['private-limited-company', 'gst-registration', 'trademark-registration', 'talk-to-lawyer'];

export function Home() {
  const ref = useRef(null);
  const tilt = useTilt();
  usePageMotion(ref);
  usePageMeta({title: 'Pirento Ecosystem — one account for legal, tax, identity and more'});

  return (
    <div ref={ref}>
      <section className="hero relative overflow-hidden pt-36 pb-20 md:pt-44 md:pb-28">
        <div aria-hidden className="grid-bg absolute inset-0" />
        <div className="container-x relative grid gap-14 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <p className="eyebrow" data-hero-fade>
              Pirento Ecosystem · {PRODUCTS.length} products
            </p>
            <Heading as="h1" text={home.title} hl={home.highlight} className="h-hero mt-6" />
            <p className="body mt-8" data-hero-fade dangerouslySetInnerHTML={{__html: home.intro}} />
            <div className="mt-10 flex flex-wrap gap-3" data-hero-fade>
              <Button to="/legal/services" variant="accent">
                Browse legal services
              </Button>
              <Button to="/products" variant="outline">
                See all products
              </Button>
            </div>
          </div>
          <div className="lg:col-span-5" data-hero-visual>
            <div ref={tilt} className="transition-transform duration-300 ease-out">
              <Illustration name="ecosystem" className="shadow-[0_30px_80px_-40px_rgba(15,38,32,0.4)]" />
            </div>
          </div>
        </div>
        <div aria-hidden className="container-x relative mt-16 hidden items-center gap-3 text-xs text-muted md:flex">
          <span className="relative h-10 w-px overflow-hidden bg-rule">
            <span className="scroll-line absolute inset-0 bg-ink" />
          </span>
          Scroll
        </div>
      </section>

      <Section id="products">
        <SectionHeader n={1} label={home.ecosystem.label} title={home.ecosystem.title} intro={home.ecosystem.intro} />
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCTS.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </Section>

      <Section inverse>
        <SectionHeader n={2} label={home.how.label} title={home.how.title} />
        <div className="mt-20">
          <Steps steps={home.how.steps} />
        </div>
      </Section>

      <Section>
        <SectionHeader
          n={3}
          label={home.legal.label}
          title={home.legal.title}
          hl="priced up front."
          intro={home.legal.intro}
        />
        <div className="mt-16 grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7" data-reveal>
            <Illustration name={productIllustration.legal} />
          </div>
          <div className="lg:col-span-5">
            <ul className="border-t border-rule">
              {featured.map((slug) => {
                const s = SERVICES.find((x) => x.slug === slug);
                return (
                  <li key={slug} data-reveal>
                    <Link
                      to={`/services/${slug}`}
                      className="group flex items-center justify-between gap-4 border-b border-rule py-5"
                    >
                      <span>
                        <span className="block text-lg font-medium">{s.name}</span>
                        <span className="text-sm text-muted">{s.deliveryTime}</span>
                      </span>
                      <span className="num text-2xl! transition-colors group-hover:text-ink">{inr(s.price)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="mt-6 flex flex-wrap gap-2" data-reveal>
              {LEGAL_CATALOGUE.slice(0, 6).map((c) => (
                <Tag key={c.title}>{c.title}</Tag>
              ))}
            </div>
            <div className="mt-8" data-reveal>
              <Button to="/legal/services" variant="outline">
                All legal services
              </Button>
            </div>
          </div>
        </div>
      </Section>

      <Section className="pt-0! md:pt-0!">
        <SectionHeader n={4} label={home.numbers.label} title={home.numbers.title} />
        <div className="mt-16">
          <StatsRow stats={stats} />
        </div>
      </Section>

      <Section className="pt-0! md:pt-0!">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <SectionHeader n={5} label={home.faq.label} title={home.faq.title} />
          </div>
          <div className="md:col-span-8">
            <Faq items={home.faq.items} />
          </div>
        </div>
      </Section>

      <ContactCta n={6} />
    </div>
  );
}
