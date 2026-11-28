// A product card on the Pirento home, dressed in that product's own colours: its dark as the card and its accent in
// the picture, the status and the link, so each card previews the product's site.
import {Link} from 'react-router-dom';
import {ArrowUpRight} from 'lucide-react';
import {Illustration} from '../../components/Illustration';
import {StatusTag} from '../../components/ui/Tag';
import {productCardArt} from '../../data/site';

export function ProductCard({product, group, wide = false}) {
  return (
    <Link
      to={`/${product.slug}`}
      data-reveal
      data-cursor="Visit"
      // The colours come from the brand register (PRODUCT_COLOURS) through the product, never from here.
      style={{'--inverse': product.dark, '--accent': product.color, '--on-accent': product.onColor}}
      className={`inverse group/pc flex h-full flex-col overflow-hidden rounded-[22px] border border-rule transition-[border-color,transform] duration-500 ease-ui hover:-translate-y-1 hover:border-accent ${
        wide ? 'lg:grid lg:grid-cols-2' : ''
      }`}
    >
      <Illustration
        name={productCardArt[product.slug]}
        className={`rounded-none border-0 ${wide ? 'lg:flex lg:items-center' : ''}`}
      />
      <div className="flex flex-1 flex-col p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs tracking-[0.12em] text-muted uppercase">{group}</span>
          <StatusTag status={product.status} />
        </div>
        <h3 className="mt-4 text-[clamp(1.5rem,2.4vw,2rem)] leading-tight">{product.name}</h3>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">{product.overview}</p>
        <ul className="mt-5 flex flex-wrap gap-2">
          {product.highlights.slice(0, wide ? 3 : 2).map((h) => (
            <li key={h.title} className="rounded-full border border-rule px-3 py-1 text-xs">
              {h.title}
            </li>
          ))}
        </ul>
        <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-medium">
          Open {product.short}
          <ArrowUpRight
            aria-hidden
            className="size-4 transition-transform duration-500 group-hover/pc:translate-x-0.5 group-hover/pc:-translate-y-0.5"
          />
        </span>
      </div>
    </Link>
  );
}
