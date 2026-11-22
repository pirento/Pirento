// Pirento One plans as pricing cards, for its home page and its dashboard; `action` adds each card's button.
import {CheckList} from '../../components/ui/Blocks';
import {Tag} from '../../components/ui/Tag';
import {appDashboards} from '../../data/site';
import {inr} from '../../lib/format';

const copy = appDashboards.one.plans;

export function PlanCards({plans, current, action}) {
  // Two plans sit side by side at a readable width; three or more use the full row.
  const grid = plans.length > 2 ? 'md:grid-cols-2 lg:grid-cols-3' : 'max-w-4xl md:grid-cols-2';
  return (
    <ul className={`grid gap-4 ${grid}`}>
      {plans.map((p) => {
        const mine = current?.id === String(p._id);
        return (
          <li
            key={p._id}
            data-reveal
            className={`flex flex-col rounded-[22px] border p-6 md:p-8 ${p.recommended ? 'border-accent bg-stone' : 'border-rule'}`}
          >
            <div className="flex min-h-7 flex-wrap items-center gap-2">
              <h3 className="eyebrow mr-auto">{p.name}</h3>
              {p.recommended && <Tag tone="accent">{copy.recommended}</Tag>}
              {mine && <Tag>{copy.current}</Tag>}
            </div>
            <p className="mt-6 display text-5xl tabular-nums md:text-6xl">{inr(p.price / 100)}</p>
            <p className="mt-2 text-sm text-muted">{p.price ? copy.period(p.months) : copy.forever}</p>

            <div className="mt-8 flex items-baseline gap-3 rounded-[18px] border border-rule bg-paper px-5 py-4">
              <span className="display text-4xl tabular-nums">{p.commissionPct}%</span>
              <span className="text-sm text-muted">{copy.rateLabel}</span>
            </div>

            {p.features.length > 0 && (
              <div className="mt-8">
                <CheckList items={p.features} />
              </div>
            )}
            {action && <div className="mt-auto pt-8">{action(p, mine)}</div>}
          </li>
        );
      })}
    </ul>
  );
}
