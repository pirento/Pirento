// Pirento Green → My trees: the customer's paid sponsorships, with the planting record the team wrote for each.
import {Link} from 'react-router-dom';
import {MapPin, Sprout} from 'lucide-react';
import {StatsRow} from '../../components/ui/Blocks';
import {green as copy} from '../../data/site';
import {formatDay} from '../../lib/format';

const PAID = ['paid', 'in_progress', 'completed'];
const mapUrl = ({lat, lng}) => `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`;
const trees = (n) => `${n} tree${n === 1 ? '' : 's'}`;

export function GreenTrees({mine, loading}) {
  const paid = mine.filter((o) => PAID.includes(o.status));
  const planted = paid.filter((o) => o.fulfilment?.site);
  const count = (list) => list.reduce((n, o) => n + o.quantity, 0);
  return (
    <div className="space-y-10">
      <StatsRow
        compact
        stats={[
          {value: loading ? '—' : String(count(paid)), label: 'trees sponsored'},
          {value: loading ? '—' : String(count(planted)), label: 'planted'},
          {value: loading ? '—' : String(count(paid) - count(planted)), label: 'waiting'},
          {value: loading ? '—' : String(new Set(paid.map((o) => o.serviceSlug)).size), label: 'drives'},
        ]}
      />
      {!loading && paid.length === 0 ? (
        <p className="text-muted">
          {copy.trees.empty}{' '}
          <Link to="/green#services" className="text-ink underline underline-offset-4">
            See the drives
          </Link>
        </p>
      ) : (
        <ul className="border-t border-rule">
          {paid.map((o) => {
            const f = o.fulfilment;
            return (
              <li key={o._id} className="flex gap-4 border-b border-rule py-5" data-reveal>
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-rule">
                  {f?.site ? <MapPin aria-hidden className="size-4" /> : <Sprout aria-hidden className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/green/dashboard/orders/${o._id}`}
                    className="block font-medium underline-offset-4 hover:underline"
                  >
                    {trees(o.quantity)} · {o.serviceName.replace(/^Sponsor trees · /, '')}
                  </Link>
                  <p className="mt-1 text-sm text-muted">
                    {f?.site
                      ? `Planted at ${f.site}${f.plantedOn ? ` on ${formatDay(f.plantedOn)}` : ''}`
                      : copy.trees.waiting}
                    {' · '}Order #{o.orderNo}
                  </p>
                  <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    {f?.lat && f?.lng && (
                      <a href={mapUrl(f)} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                        See the spot on the map
                      </a>
                    )}
                    {o.code && (
                      <Link to={`/verify/${o.code}`} className="underline underline-offset-4">
                        Proof code {o.code}
                      </Link>
                    )}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
