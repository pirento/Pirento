// Where your money went: paid orders summed per product, as a labelled bar list (one series, so one ink colour).
import {getProduct} from '@pirento/shared';
import {inr} from '../../lib/format';
import {spent} from './useDashboardData';

export function SpendByProduct({orders}) {
  const totals = {};
  for (const o of spent(orders)) totals[o.product] = (totals[o.product] ?? 0) + o.amount;
  const rows = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const max = rows[0]?.[1] ?? 1;
  const all = rows.reduce((s, [, v]) => s + v, 0);
  return (
    <section
      id="spend"
      aria-labelledby="spend-h"
      className="scroll-mt-24 rounded-[22px] border border-rule p-6 md:p-7"
      data-reveal
    >
      <h2 id="spend-h" className="text-xl">
        Spent by product
      </h2>
      <p className="mt-1 text-sm text-muted">
        {rows.length ? `${inr(all / 100)} in all, paid orders only` : 'Paid orders show here.'}
      </p>
      <ul className="mt-6 space-y-4">
        {rows.map(([slug, v]) => {
          const p = getProduct(slug);
          return (
            <li key={slug} title={`${p?.name}: ${inr(v / 100)}`}>
              <span className="flex items-baseline justify-between gap-4 text-sm">
                <span className="flex items-center gap-2">
                  {/* The product's colour as a small identity mark; the bar itself stays ink. */}
                  <span aria-hidden className="size-2 rounded-[2px]" style={{background: p?.color}} />
                  {p?.name ?? slug}
                </span>
                <span className="tabular-nums">{inr(v / 100)}</span>
              </span>
              <span className="mt-2 block h-2 rounded-full bg-stone" aria-hidden>
                <span
                  className="block h-full rounded-full bg-ink"
                  style={{width: `${Math.max(4, (v / max) * 100)}%`}}
                />
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
