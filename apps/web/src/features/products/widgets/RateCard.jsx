// Pirento Black: every filing on one rate card, like a price list pinned to the wall.
import {Link} from 'react-router-dom';
import {inr} from '../../../lib/format';
import {useServicesFor} from '../../../lib/prices';
import {WidgetCard} from './Card';

export function RateCard() {
  const services = useServicesFor('black').filter((s) => s.price);
  return (
    <WidgetCard label={`Rate card · ${services.length} filings`}>
      <ul className="mt-4">
        {services.map((s, i) => (
          <li key={s.slug}>
            <Link
              to={`/services/${s.slug}`}
              className="grid grid-cols-[2rem_1fr_auto] items-baseline gap-3 border-b border-rule py-3 last:border-0 hover:text-ink"
            >
              <span className="text-xs tabular-nums text-muted">{String(i + 1).padStart(2, '0')}</span>
              <span className="min-w-0">
                <span className="block truncate">{s.name}</span>
                {s.deliveryTime && <span className="text-xs text-muted">{s.deliveryTime}</span>}
              </span>
              <span className="tabular-nums">{inr(s.price)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </WidgetCard>
  );
}
