// A product card on the Pirento home: its picture framed inside the card with the product's mark and place in the
// ring, then its name, what it does, two things it gives, and a round button that takes the product's colour on hover.
import {Link} from 'react-router-dom';
import {ArrowUpRight} from 'lucide-react';
import {Illustration} from '../../components/Illustration';
import {ProductIcon} from '../../components/ui/ProductIcon';
import {StatusTag} from '../../components/ui/Tag';
import {productCardArt} from '../../data/site';

const two = (n) => String(n).padStart(2, '0');

export function ProductCard({product, group, index, count, tabIndex}) {
  return (
    <Link
      to={`/${product.slug}`}
      tabIndex={tabIndex}
      data-cursor="Visit"
      // The colour comes from the brand register (PRODUCT_COLOURS) through the product, never from here.
      style={{'--accent': product.color, '--on-accent': product.onColor}}
      className="group/pc flex h-full flex-col rounded-[28px] border border-rule bg-paper p-2.5 transition-[border-color] duration-500 ease-ui hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-4"
    >
      <div className="relative">
        <Illustration name={productCardArt[product.slug]} className="rounded-[20px] border-0" />
        <span className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-paper py-1 pr-3 pl-1 text-xs font-medium shadow-sm">
          <ProductIcon product={product} className="size-6" />
          {product.short}
        </span>
        <span className="absolute top-3 right-3 rounded-full bg-paper px-2.5 py-1 font-mono text-[0.7rem] text-muted tabular-nums shadow-sm">
          {two(index + 1)} / {two(count)}
        </span>
      </div>

      <div className="flex flex-1 flex-col px-4 pt-5 pb-3 md:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs tracking-[0.12em] text-muted uppercase">{group}</span>
          <StatusTag status={product.status} />
        </div>
        <h3 className="mt-3 text-[clamp(1.5rem,2.4vw,1.9rem)] leading-tight">{product.name}</h3>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{product.overview}</p>
        <ul className="mt-4 divide-y divide-rule border-y border-rule text-sm">
          {product.highlights.slice(0, 2).map((h) => (
            <li key={h.title} className="flex items-center gap-3 py-2.5">
              <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-accent" />
              {h.title}
            </li>
          ))}
        </ul>
        <div className="mt-auto flex items-center justify-between pt-5">
          <span className="text-sm font-medium">Open {product.short}</span>
          <span
            aria-hidden
            className="flex size-10 items-center justify-center rounded-full border border-rule transition-colors duration-500 ease-ui group-hover/pc:border-accent group-hover/pc:bg-accent group-hover/pc:text-on-accent"
          >
            <ArrowUpRight className="size-4 transition-transform duration-500 group-hover/pc:rotate-45" />
          </span>
        </div>
      </div>
    </Link>
  );
}
