// Giftox: the boxes side by side in their own scrolling track, contents and price on each.
import {Link} from 'react-router-dom';
import {inr} from '../../../lib/format';
import {useServicesFor} from '../../../lib/prices';

export function BoxStrip() {
  const boxes = useServicesFor('giftox').filter((s) => s.price);
  return (
    <ul className="no-scrollbar flex snap-x gap-4 overflow-x-auto pb-2">
      {boxes.map((b) => (
        <li key={b.slug} className="w-72 shrink-0 snap-start" data-reveal>
          <Link
            to={`/services/${b.slug}`}
            data-cursor="View"
            className="group flex h-full flex-col rounded-[22px] border border-rule bg-paper p-6 text-left transition-[border-color,transform] duration-500 ease-ui hover:-translate-y-1 hover:border-ink"
          >
            {/* A drawn box lid: the one place the accent shows on each card. */}
            <span aria-hidden className="relative h-24 rounded-[14px] bg-stone">
              <span className="absolute inset-x-6 top-6 h-3 rounded-full bg-accent" />
              <span className="absolute inset-x-10 top-9 bottom-4 rounded-b-[10px] border border-rule bg-paper" />
            </span>
            <span className="mt-5 text-sm text-muted">{b.category}</span>
            <span className="mt-1 text-lg font-medium">{b.name}</span>
            <span className="mt-3 text-sm text-muted">{b.items?.join(' · ')}</span>
            <span className="num mt-auto pt-6 text-3xl!">{inr(b.price)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
