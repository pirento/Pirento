// Pirento Legal: search every legal service from the hero, with its price.
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {Search} from 'lucide-react';
import {inr} from '../../../lib/format';
import {useServicesFor} from '../../../lib/prices';
import {WidgetCard} from './Card';

const POPULAR = ['private-limited-company', 'gst-registration', 'trademark-registration', 'talk-to-lawyer'];

export function ServiceSearch() {
  const services = useServicesFor('legal');
  const [q, setQ] = useState('');
  const needle = q.trim().toLowerCase();
  const list = needle
    ? services
        .filter((s) => s.name.toLowerCase().includes(needle) || s.category.toLowerCase().includes(needle))
        .slice(0, 5)
    : POPULAR.map((slug) => services.find((s) => s.slug === slug)).filter(Boolean);
  return (
    <WidgetCard label={`Search ${services.length} services`}>
      <label className="relative mt-4 block">
        <span className="sr-only">Search legal services</span>
        <Search aria-hidden className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="GST, trademark, company…"
          className="w-full rounded-[14px] border border-rule bg-paper py-3 pr-4 pl-11 outline-none focus:border-ink"
        />
      </label>
      <p className="mt-5 text-xs text-muted">
        {needle ? `${list.length ? 'Best matches' : 'Nothing matches'}` : 'Asked for most'}
      </p>
      <ul className="mt-2">
        {list.map((s) => (
          <li key={s.slug}>
            <Link
              to={`/services/${s.slug}`}
              className="flex items-center justify-between gap-4 border-b border-rule py-3 hover:text-ink"
            >
              <span className="min-w-0 truncate">{s.name}</span>
              <span className="shrink-0 text-sm tabular-nums text-muted">{s.price ? inr(s.price) : 'Consult'}</span>
            </Link>
          </li>
        ))}
      </ul>
      <Link to="/legal/services" className="mt-4 inline-block text-sm underline underline-offset-4">
        Browse every category
      </Link>
    </WidgetCard>
  );
}
