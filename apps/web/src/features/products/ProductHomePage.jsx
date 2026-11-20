// A product's own home page.
import {useRef} from 'react';
import {useParams} from 'react-router-dom';
import {AlertTriangle} from 'lucide-react';
import {PRODUCTS, getProduct} from '@pirento/shared';
import {ContactCta} from '../../components/layout/ContactCta';
import {Faq, Steps} from '../../components/ui/Blocks';
import {Heading, Label, Section, SectionHeader} from '../../components/ui/Heading';
import {NotFound} from '../ecosystem/NotFoundPage';
import {Hero} from './Hero';
import {Audience, Features, Related} from './HomeSections';
import {Extra} from './ProductExtra';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';
import {useServicesFor} from '../../lib/prices';

export function ProductHome() {
  const {slug} = useParams();
  const product = getProduct(slug);
  const services = useServicesFor(slug);
  const ref = useRef(null);
  usePageMotion(ref, [slug]);
  usePageMeta({title: product ? `${product.name} — ${product.overview}` : 'Not found', description: product?.overview});
  if (!product) return <NotFound />;
  const index = PRODUCTS.indexOf(product);
  const withServices = {...product, services: services.some((s) => s.price)};

  return (
    <div ref={ref} key={slug}>
      <Hero product={withServices} index={index} />
      <Features product={product} />
      <Extra product={product} />
      <Audience product={product} />
      <section id="how" className="inverse py-28 md:py-40">
        <div className="container-x">
          <Label n={4}>How it works</Label>
          <Heading text="From first click / to done." className="h-section mt-6 mb-20" data-lines />
          <Steps steps={product.steps} />
        </div>
      </section>
      <Section>
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <SectionHeader n={5} label="Questions" title="Before you / begin." />
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
      <Related product={product} />
      <ContactCta n={7} />
    </div>
  );
}

// ── Dashboards ───────────────────────────────────────────────────────────
