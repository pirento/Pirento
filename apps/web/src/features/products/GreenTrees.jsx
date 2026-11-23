// Pirento Green → My trees: the customer's paid sponsorships, with the planting record the team wrote for each.
import {useState} from 'react';
import {Link} from 'react-router-dom';
import {MapPin, Sprout} from 'lucide-react';
import {StatsRow} from '../../components/ui/Blocks';
import {green as copy} from '../../data/site';
import {api} from '../../lib/api/client';
import {useApi} from '../../lib/api/useApi';
import {formatDay} from '../../lib/format';
import {credits} from '../green/money';

const PAID = ['paid', 'in_progress', 'completed'];
const mapUrl = ({lat, lng}) => `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`;
const trees = (n) => `${n} tree${n === 1 ? '' : 's'}`;

/** What a planted sponsorship has grown, and a button that moves it into the person's credits. */
function Grown({tree, onClaimed}) {
  const [note, setNote] = useState('');
  if (!tree.rate) return <span className="text-muted">Credits start once the team sets this drive's rate.</span>;
  const claim = async () => {
    setNote('');
    try {
      await api(`/green/claims/${tree.orderId}`, {method: 'POST'});
      onClaimed();
    } catch (err) {
      setNote(`⚠ ${err.message}`);
    }
  };
  return (
    <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
      <span className="tabular-nums">
        {credits(tree.growingUnits)} credits grown · {credits(tree.claimedUnits)} claimed
      </span>
      {tree.growingUnits > 0 && (
        <button onClick={claim} className="rounded-full border border-rule px-3 py-1 hover:border-ink">
          Claim
        </button>
      )}
      {note && <span role="alert">{note}</span>}
    </span>
  );
}

export function GreenTrees({mine, loading}) {
  const growth = useApi('/green/me');
  const treeOf = (o) => growth.data?.trees.find((t) => t.orderId === o._id);
  const paid = mine.filter((o) => PAID.includes(o.status));
  const planted = paid.filter((o) => o.fulfilment?.site);
  const count = (list) => list.reduce((n, o) => n + o.quantity, 0);
  const ready = growth.data?.trees.filter((t) => t.rate && t.growingUnits > 0) ?? [];
  const [claimNote, setClaimNote] = useState('');
  // One claim per sponsorship, as the server takes them; each is checked there on its own.
  const claimAll = async () => {
    setClaimNote('');
    const results = await Promise.allSettled(ready.map((t) => api(`/green/claims/${t.orderId}`, {method: 'POST'})));
    const failed = results.filter((r) => r.status === 'rejected').length;
    setClaimNote(failed ? `⚠ ${failed} could not be claimed just now. Try again.` : 'Claimed into your credits.');
    growth.reload();
  };
  return (
    <div className="space-y-10">
      <StatsRow
        compact
        stats={[
          {value: loading ? '—' : String(count(paid)), label: 'trees'},
          {value: loading ? '—' : String(count(planted)), label: 'planted'},
          {value: loading ? '—' : String(count(paid) - count(planted)), label: 'waiting'},
          {value: loading ? '—' : String(new Set(paid.map((o) => o.serviceSlug)).size), label: 'drives'},
          {value: growth.data ? credits(growth.data.units) : '—', label: 'credits held'},
        ]}
      />
      {(ready.length > 0 || claimNote) && (
        <div className="flex flex-wrap items-center gap-4">
          {ready.length > 0 && (
            <button
              onClick={claimAll}
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-on-accent"
            >
              Claim all · {credits(ready.reduce((n, t) => n + t.growingUnits, 0))} credits
            </button>
          )}
          {claimNote && (
            <p role="status" className="text-sm">
              {claimNote}
            </p>
          )}
        </div>
      )}
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
                    {treeOf(o) && <Grown tree={treeOf(o)} onClaimed={growth.reload} />}
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
