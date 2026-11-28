// Home: a slow strip of the ten products between the hero and the product cards, so the cards do not arrive at once.
// Each name links to its product; the strip is shown twice so it loops, and the copy is hidden from screen readers.
import {Link} from 'react-router-dom';
import {PRODUCTS} from '@pirento/shared';
import {ProductIcon} from '../../components/ui/ProductIcon';
import {home} from '../../data/site';

function Row({hidden}) {
  return (
    <ul className="flex shrink-0 items-center gap-12 pr-12" aria-hidden={hidden || undefined}>
      {PRODUCTS.map((p) => (
        <li key={p.slug}>
          <Link
            to={`/${p.slug}`}
            tabIndex={hidden ? -1 : undefined}
            className="flex items-center gap-3 text-[clamp(1.25rem,2.2vw,1.75rem)] whitespace-nowrap hover:underline"
          >
            <ProductIcon product={p} className="size-9" />
            {p.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function ProductMarquee() {
  return (
    <section aria-label={home.marquee} className="border-y border-rule py-10">
      <p className="container-x eyebrow">{home.marquee}</p>
      <div className="mt-8 overflow-hidden">
        <div className="marquee flex w-max">
          <Row />
          <Row hidden />
        </div>
      </div>
    </section>
  );
}
