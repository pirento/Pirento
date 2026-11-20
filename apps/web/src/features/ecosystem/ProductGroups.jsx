// Home: the ten products grouped by what you need, one row per group.
import {getProduct} from '@pirento/shared';
import {Section, SectionHeader} from '../../components/ui/Heading';
import {ProductCard} from './ProductCard';

export function ProductGroups({copy, n}) {
  return (
    <Section id="products">
      <SectionHeader n={n} label={copy.label} title={copy.title} intro={copy.intro} />
      <div className="mt-16 border-t border-rule">
        {copy.groups.map((g, i) => (
          <div key={g.title} className="grid gap-6 border-b border-rule py-10 lg:grid-cols-12" data-reveal>
            <div className="lg:col-span-4">
              <span className="text-sm text-muted tabular-nums">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-2 text-2xl">{g.title}</h3>
              <p className="mt-2 text-muted">{g.body}</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-3">
              {g.products.map((slug) => (
                <ProductCard key={slug} product={getProduct(slug)} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
