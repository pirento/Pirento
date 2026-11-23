// Pirento Green's dashboard overview: the price, the person's credits and their worth, credits ready to claim, and trees.
import {Link} from 'react-router-dom';
import {StatsRow} from '../../components/ui/Blocks';
import {green} from '../../data/site';
import {useApi} from '../../lib/api/useApi';
import {PriceLine} from './Market';
import {credits, rupees} from './money';

const copy = green.snapshot;

export function Snapshot() {
  const market = useApi('/green/market');
  const me = useApi('/green/me');
  const m = market.data;
  const mine = me.data;
  const ready = mine?.trees.reduce((n, t) => n + t.growingUnits, 0) ?? 0;
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        {m && <PriceLine market={m} />}
        <span className="text-sm text-muted">{m ? (m.open ? copy.open : copy.closed) : ''}</span>
      </div>
      <StatsRow
        compact
        stats={[
          {value: mine ? credits(mine.units) : '—', label: 'your credits'},
          {value: mine?.value != null ? rupees(mine.value) : '—', label: 'worth now'},
          {value: mine ? credits(ready) : '—', label: 'ready to claim'},
          {value: mine ? String(mine.trees.reduce((n, t) => n + t.trees, 0)) : '—', label: 'trees growing'},
        ]}
      />
      <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {copy.links.map(([label, to]) => (
          <Link key={to} to={to} className="underline underline-offset-4">
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
