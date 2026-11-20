// A product's own home page.
import {useRef} from 'react';
import {useParams} from 'react-router-dom';
import {AlertTriangle} from 'lucide-react';
import {PRODUCTS, getProduct, servicesFor} from '@pirento/shared';
import {ContactCta} from '../../components/layout/ContactCta';
import {Faq, Steps} from '../../components/ui/Blocks';
import {Heading, Label, Section, SectionHeader} from '../../components/ui/Heading';
import {NotFound} from '../ecosystem/NotFoundPage';
import {Hero} from './Hero';
import {Extra} from './ProductExtra';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';

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
