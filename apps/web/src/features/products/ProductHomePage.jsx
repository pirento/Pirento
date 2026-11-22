// A product's own home page, laid out by its design (designs.js) and numbered in order.
import {useRef} from 'react';
import {useParams} from 'react-router-dom';
import {AlertTriangle} from 'lucide-react';
import {getProduct} from '@pirento/shared';
import {ContactCta} from '../../components/layout/ContactCta';
import {PlansSection} from '../partner/PlansSection';
import {BusinessSection} from '../business/BusinessSection';
import {AuthSection, WaysSection} from '../identity/HomeSections';
import {useApi} from '../../lib/api/useApi';
import {Faq} from '../../components/ui/Blocks';
import {Section, SectionHeader} from '../../components/ui/Heading';
import {NotFound} from '../ecosystem/NotFoundPage';
import {Hero} from './Hero';
import {Audience, Features, How, Related} from './HomeSections';
import {Extra} from './ProductExtra';
import {designFor} from './designs';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';
import {useServicesFor} from '../../lib/prices';

function Questions({product, n}) {
  return (
    <Section>
      <div className="grid gap-12 md:grid-cols-12">
        <div className="md:col-span-4">
          <SectionHeader n={n} label="Questions" title="Before you / begin." />
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
  );
}

export function ProductHome() {
  const {slug} = useParams();
  const product = getProduct(slug);
  const services = useServicesFor(slug);
  // Pirento One shows its plans, once a superadmin has made some.
  const plans = useApi(slug === 'one' ? '/orders/partner-plans' : null).data ?? [];
  const ref = useRef(null);
  usePageMotion(ref, [slug]);
  usePageMeta({title: product ? `${product.name} — ${product.overview}` : 'Not found', description: product?.overview});
  if (!product) return <NotFound />;
  const design = designFor(slug);
  const withServices = {...product, services: services.some((s) => s.price)};

  // The sections this site shows, in order; numbers follow, so a skipped one leaves no gap.
  const sections = [
    (n) => <Features key="f" product={product} variant={design.features} n={n} />,
    design.covers !== 'extra' && ((n) => <Extra key="e" product={product} n={n} />),
    (n) => <Audience key="a" product={product} n={n} />,
    plans.length > 0 && ((n) => <PlansSection key="p" plans={plans} n={n} />),
    slug === 'bharat-id' && ((n) => <WaysSection key="w" n={n} />),
    slug === 'bharat-id' && ((n) => <AuthSection key="au" n={n} />),
    slug === 'bharat-id' && ((n) => <BusinessSection key="b" n={n} />),
    design.covers !== 'how' && ((n) => <How key="h" product={product} variant={design.how} n={n} />),
    (n) => <Questions key="q" product={product} n={n} />,
    (n) => <Related key="r" product={product} n={n} />,
    (n) => <ContactCta key="c" n={n} />,
  ].filter(Boolean);

  return (
    <div ref={ref} key={slug}>
      <Hero product={withServices} design={design} />
      {sections.map((render, i) => render(i + 1))}
    </div>
  );
}
