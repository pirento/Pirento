// Home: the ten products as cards in their own colours, in the order of the needs they meet (copy.groups).
// Legal and AI take two columns on wide screens, so four rows of three fill without gaps.
import {getProduct} from '@pirento/shared';
import {Section, SectionHeader} from '../../components/ui/Heading';
import {ProductCard} from './ProductCard';

const WIDE = ['legal', 'ai'];

export function ProductGroups({copy, n}) {
  const cards = copy.groups.flatMap((g) => g.products.map((slug) => ({slug, group: g.title})));
  return (
    <Section id="products">
      <SectionHeader n={n} label={copy.label} title={copy.title} intro={copy.intro} />
      <ul className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map(({slug, group}) => (
          <li key={slug} className={WIDE.includes(slug) ? 'md:col-span-2' : ''}>
            <ProductCard product={getProduct(slug)} group={group} wide={WIDE.includes(slug)} />
          </li>
        ))}
      </ul>
    </Section>
  );
}
