// All ten products, one row each.
import {useRef} from 'react';
import {PRODUCTS} from '@pirento/shared';
import {Illustration} from '../../components/Illustration';
import {PageHero} from '../../components/PageHero';
import {ContactCta} from '../../components/layout/ContactCta';
import {CheckList} from '../../components/ui/Blocks';
import {Button} from '../../components/ui/Button';
import {StatusTag} from '../../components/ui/Tag';
import {productIllustration} from '../../data/site';
import {usePageMotion} from '../../lib/motion';
import {usePageMeta} from '../../lib/page';

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
          <Button to={`/${product.slug}`} variant="outline" data-cursor="Visit">
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
