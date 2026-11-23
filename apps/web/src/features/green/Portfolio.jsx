// Pirento Green → Portfolio: tree investments at what was paid, carbon credits at today's price, donations apart.
import {isDonation} from '@pirento/shared';
import {StatsRow} from '../../components/ui/Blocks';
import {green} from '../../data/site';
import {useApi} from '../../lib/api/useApi';
import {credits, rupees} from './money';

const copy = green.portfolio;
const PAID = ['paid', 'in_progress', 'completed'];
const sum = (list, f) => list.reduce((n, x) => n + f(x), 0);

export function Portfolio({mine, loading}) {
  const me = useApi('/green/me');
  const paid = mine.filter((o) => PAID.includes(o.status));
  const invested = paid.filter((o) => !isDonation(o));
  const donated = paid.filter(isDonation);
  const g = me.data;
  const ready = g ? sum(g.trees, (t) => t.growingUnits) : 0;
  const treeValue = sum(invested, (o) => o.amount);
  const show = (v) => (loading ? '—' : v);
  // Each drive's trees and what was paid for them, planted or not yet.
  const drives = Object.values(
    invested.reduce((acc, o) => {
      const d = (acc[o.serviceSlug] ??= {
        name: o.serviceName.replace(/^Sponsor trees · /, ''),
        trees: 0,
        planted: 0,
        paid: 0,
      });
      d.trees += o.quantity;
      d.paid += o.amount;
      if (o.fulfilment?.site) d.planted += o.quantity;
      return acc;
    }, {}),
  );

  return (
    <div className="space-y-12">
      <p className="body -mt-2">{copy.intro}</p>
      <StatsRow
        compact
        stats={[
          {
            value: show(g?.value != null ? rupees(treeValue + g.value) : rupees(treeValue)),
            label: 'portfolio',
          },
          {value: show(rupees(treeValue)), label: 'in trees'},
          {value: g?.value != null ? rupees(g.value) : '—', label: 'in credits'},
          {value: show(rupees(sum(donated, (o) => o.amount))), label: 'donated'},
        ]}
      />
      <section aria-labelledby="pf-trees">
        <h3 id="pf-trees" className="eyebrow">
          {copy.trees}
        </h3>
        {drives.length === 0 ? (
          <p className="mt-4 text-muted">—</p>
        ) : (
          <ul className="mt-4 border-t border-rule">
            {drives.map((d) => (
              <li
                key={d.name}
                className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-rule py-4"
              >
                <span className="font-medium">{d.name}</span>
                <span className="text-sm tabular-nums text-muted">
                  {d.trees} trees · {d.planted} planted · {rupees(d.paid)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="pf-credits">
        <h3 id="pf-credits" className="eyebrow">
          {copy.credits}
        </h3>
        <dl className="mt-4 divide-y divide-rule border-y border-rule text-sm">
          {[
            ['Held', g ? `${credits(g.units)} credits` : '—'],
            ['Worth at today’s price', g?.value != null ? rupees(g.value) : '—'],
            ['Paid for the ones held', g ? rupees(g.cost) : '—'],
            ['Grown by your trees, ready to claim', g ? `${credits(ready)} credits` : '—'],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-wrap justify-between gap-x-6 gap-y-1 py-3">
              <dt className="text-muted">{k}</dt>
              <dd className="tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
      </section>
      {donated.length > 0 && (
        <section aria-labelledby="pf-donations">
          <h3 id="pf-donations" className="eyebrow">
            {copy.donations}
          </h3>
          <p className="mt-4 text-sm text-muted">
            {sum(donated, (o) => o.quantity)} trees · {rupees(sum(donated, (o) => o.amount))}
          </p>
        </section>
      )}
    </div>
  );
}
