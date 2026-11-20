// A product tile wearing that product's brand colour.
import {Link} from 'react-router-dom';
import {ArrowUpRight} from 'lucide-react';
import {StatusTag} from '../../components/ui/Tag';

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
