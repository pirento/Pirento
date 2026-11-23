// Admin → Pirento Green: trees sponsored and planted per drive, sponsorships waiting for a planting record, and
// (finance and superadmins) the carbon market.
import {Link} from 'react-router-dom';
import {StatsRow} from '../../components/ui/Blocks';
import {Button} from '../../components/ui/Button';
import {Tag} from '../../components/ui/Tag';
import {green} from '../../data/site';
import {useApi} from '../../lib/api/useApi';
import {formatDate, inr} from '../../lib/format';
import {useServicesFor} from '../../lib/prices';
import {GreenMarketAdmin} from './GreenMarketAdmin';

const copy = green.admin;
const driveName = (name) => name.replace(/^Sponsor trees · /, '');

export function GreenAdmin() {
  const {data, error} = useApi('/orders/staff/green');
  // Drives are Green's services: live prices (and anything made in admin) come from the catalogue.
  const drives = useServicesFor('green');
  if (error) return <p className="text-muted">⚠ {error.message}</p>;
  if (data && !data.totals) return <p className="text-muted">Pirento Green is outside the products you work on.</p>;
  const t = data?.totals;
  const v = (x) => (t ? String(x) : '—');
  const counted = (slug) => data?.drives.find((d) => d.slug === slug);
  const hasMoney = t && t.raised !== undefined;

  return (
    <div className="space-y-14">
      <StatsRow
        compact
        stats={[
          {value: v(t?.trees), label: 'trees'},
          {value: v(t?.planted), label: 'planted'},
          {value: v(t ? t.trees - t.planted : 0), label: 'waiting'},
          {value: v(t?.sponsors), label: 'sponsors'},
          {value: v(t?.orders), label: 'sponsorships'},
          ...(hasMoney ? [{value: inr(t.raised / 100), label: 'paid in'}] : []),
        ]}
      />

      {/* The market is priced by the same roles that see money here (ACCESS.pricing). */}
      {hasMoney && <GreenMarketAdmin drives={drives} />}

      <section aria-labelledby="green-drives">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="green-drives" className="text-2xl">
            {copy.drives}
          </h2>
          <Button to="/admin/services?product=green" variant="outline">
            Services &amp; prices
          </Button>
        </div>
        <p className="mt-2 text-sm text-muted">{copy.prices}</p>
        <ul className="mt-6 border-t border-rule">
          {drives.map((s) => {
            const c = counted(s.slug);
            return (
              <li key={s.slug} className="flex flex-wrap items-center justify-between gap-4 border-b border-rule py-4">
                <span className="min-w-0">
                  <span className="block font-medium">{driveName(s.name)}</span>
                  <span className="block text-sm text-muted">
                    {s.category} · {s.price ? `${inr(s.price)} / tree` : 'Off sale'}
                  </span>
                </span>
                <span className="text-sm tabular-nums text-muted">
                  {c
                    ? `${c.trees} sponsored · ${c.planted} planted · ${c.sponsors} sponsor${c.sponsors === 1 ? '' : 's'}`
                    : 'No sponsorships yet'}
                  {hasMoney && c && ` · ${inr(c.raised / 100)}`}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="green-waiting">
        <h2 id="green-waiting" className="text-2xl">
          {copy.waiting}
        </h2>
        <p className="mt-2 text-sm text-muted">{copy.waitingIntro}</p>
        {data?.waiting.length === 0 ? (
          <p className="mt-6 text-muted">{copy.none}</p>
        ) : (
          <ul className="mt-6 border-t border-rule">
            {data?.waiting.map((o) => (
              <li key={o._id} className="flex flex-wrap items-center justify-between gap-4 border-b border-rule py-4">
                <span className="min-w-0">
                  <Link to={`/orders/${o._id}`} className="block font-medium underline-offset-4 hover:underline">
                    #{o.orderNo} · {o.quantity} tree{o.quantity === 1 ? '' : 's'} · {driveName(o.serviceName)}
                  </Link>
                  <span className="block text-sm text-muted">
                    Paid {formatDate(o.createdAt)}
                    {o.assignee?.email ? ` · ${o.assignee.email}` : ' · not taken'}
                  </span>
                </span>
                <Tag tone={o.status === 'paid' ? 'accent' : 'rule'}>{o.status === 'paid' ? 'New' : 'In progress'}</Tag>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
